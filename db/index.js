const mongoose = require('mongoose');
const Record = require('../models/Record');
const vaultEvents = require('../events');
const fs = require('fs');
const path = require('path');

// Create backups directory if it doesn't exist
const backupsDir = './backups';
if (!fs.existsSync(backupsDir)) {
    fs.mkdirSync(backupsDir, { recursive: true });
}

// MongoDB connection
const connectDB = async () => {
    try {
        const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/nodevault';
        await mongoose.connect(mongoURI);
        console.log('MongoDB connected successfully');
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
};

// Call connectDB when this module is loaded
connectDB();

// Record validation function
function validateRecord({ name, value }) {
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
        throw new Error('Name is required and must be a non-empty string');
    }
    if (typeof value !== 'number' || isNaN(value)) {
        throw new Error('Value must be a valid number');
    }
}

// Generate unique ID (MongoDB will auto-generate _id, but keeping for compatibility)
function generateId() {
    return new mongoose.Types.ObjectId().toString();
}

// CRUD Operations
async function addRecord({ name, value }) {
    validateRecord({ name, value });
    const newRecord = new Record({ name, value });
    await newRecord.save();
    vaultEvents.emit('recordAdded', newRecord);
    return newRecord;
}

async function listRecords() {
    return await Record.find({});
}

async function updateRecord(id, newName, newValue) {
    validateRecord({ name: newName, value: newValue });
    const updatedRecord = await Record.findByIdAndUpdate(
        id,
        { name: newName, value: newValue },
        { new: true, runValidators: true }
    );
    if (!updatedRecord) return null;
    vaultEvents.emit('recordUpdated', updatedRecord);
    return updatedRecord;
}

async function deleteRecord(id) {
    const deletedRecord = await Record.findByIdAndDelete(id);
    if (!deletedRecord) return null;
    vaultEvents.emit('recordDeleted', deletedRecord);
    return deletedRecord;
}

// Search functionality
async function searchRecords(term) {
    if (!term || !term.toString().trim()) return [];
    const t = term.toString().trim();
    const orClauses = [
        { name: new RegExp(t, "i") }
    ];
    if (/^\d+$/.test(t)) {
        orClauses.push({ value: Number(t) });
    }
    return await Record.find({ $or: orClauses });
}

// Sorting functionality
async function sortRecords(field, order) {
    const sortObj = {};
    sortObj[field === 'Name' ? 'name' : 'createdAt'] = order === 'Ascending' ? 1 : -1;
    return await Record.find().sort(sortObj);
}

// Export to text file
async function exportVault() {
    const records = await listRecords();
    const header = `Exported At: ${new Date().toISOString()}\nTotal Records: ${records.length}\n\n`;
    const content = records.map(r => `ID: ${r._id} | Name: ${r.name} | Value: ${r.value} | Created: ${r.createdAt.toISOString()}`).join('\n');
    fs.writeFileSync('export.txt', header + content, 'utf8');
    console.log('Data exported successfully to export.txt');
}

// Backup system
async function backupVault() {
    const records = await listRecords();
    const timestamp = new Date().toISOString().replace(/[:]/g, '-');
    const filename = `backup_${timestamp}.json`;
    fs.writeFileSync(path.join(backupsDir, filename), JSON.stringify(records, null, 2));
    console.log(`Backup created: ${filename}`);
}

// Statistics
async function vaultStats() {
    const records = await listRecords();
    if (!records.length) {
        console.log('Vault is empty.');
        return;
    }
    
    const total = records.length;
    const lastModified = new Date(Math.max(...records.map(r => r.updatedAt || r.createdAt))).toISOString();
    const longestName = records.reduce((prev, curr) => 
        (curr.name.length > prev.name.length ? curr : prev), 
        { name: "", length: 0 }
    );
    const sortedDates = records.map(r => new Date(r.createdAt)).sort((a, b) => a - b);
    
    console.log('Vault Statistics:');
    console.log('---');
    console.log(`Total Records: ${total}`);
    console.log(`Last Modified: ${lastModified}`);
    console.log(`Longest Name: ${longestName.name} (${longestName.name.length} characters)`);
    console.log(`Earliest Record: ${sortedDates[0].toISOString().split('T')[0]}`);
    console.log(`Latest Record: ${sortedDates[sortedDates.length - 1].toISOString().split('T')[0]}`);
}

// Make sure backup runs on CRUD events
vaultEvents.on('recordAdded', backupVault);
vaultEvents.on('recordUpdated', backupVault);
vaultEvents.on('recordDeleted', backupVault);

module.exports = { 
    addRecord, 
    listRecords, 
    updateRecord, 
    deleteRecord, 
    vaultStats, 
    backupVault, 
    exportVault, 
    sortRecords, 
    searchRecords,
    connectDB
};
