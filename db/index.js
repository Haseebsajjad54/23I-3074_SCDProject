const fileDB = require('./file');
const recordUtils = require('./record');
const vaultEvents = require('../events');
const mongoose = require('mongoose');
require('dotenv').config();

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/nodevault';

// MongoDB Schema
const recordSchema = new mongoose.Schema({
    id: { type: Number, required: true, unique: true },
    name: { type: String, required: true },
    value: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

const MongoRecord = mongoose.model('Record', recordSchema);

// Initialize MongoDB connection
let mongoConnected = false;

async function connectMongoDB() {
    try {
        mongoose.set('strictQuery', false);
        await mongoose.connect(MONGODB_URI, {
            serverSelectionTimeoutMS: 5000,
        });
        mongoConnected = true;
        console.log('✅ Connected to MongoDB');
        vaultEvents.emit('mongoDBConnected', true); // NEW EVENT
        return true;
    } catch (error) {
        console.log('❌ MongoDB connection failed, using file storage');
        mongoConnected = false;
        vaultEvents.emit('mongoDBConnected', false); // NEW EVENT
        return false;
    }
}

// Existing file-based functions
function addRecord({ name, value }) {
    recordUtils.validateRecord({ name, value });
    const data = fileDB.readDB();
    const newRecord = { id: recordUtils.generateId(), name, value };
    data.push(newRecord);
    fileDB.writeDB(data);
    vaultEvents.emit('recordAdded', newRecord);
    
    // Sync to MongoDB if connected
    if (mongoConnected) {
        syncToMongoDB(newRecord, 'add');
    }
    
    return newRecord;
}

function listRecords() {
    return fileDB.readDB();
}

function updateRecord(id, newName, newValue) {
    const data = fileDB.readDB();
    const record = data.find(r => r.id === id);
    if (!record) return null;
    record.name = newName;
    record.value = newValue;
    fileDB.writeDB(data);
    vaultEvents.emit('recordUpdated', record);
    
    // Sync to MongoDB if connected
    if (mongoConnected) {
        syncToMongoDB({ ...record, id: Number(id) }, 'update');
    }
    
    return record;
}

function deleteRecord(id) {
    let data = fileDB.readDB();
    const record = data.find(r => r.id === id);
    if (!record) return null;
    data = data.filter(r => r.id !== id);
    fileDB.writeDB(data);
    vaultEvents.emit('recordDeleted', record);
    
    // Sync to MongoDB if connected
    if (mongoConnected) {
        syncToMongoDB({ id: Number(id) }, 'delete');
    }
    
    return record;
}

// NEW: MongoDB Sync Function
async function syncToMongoDB(record, operation) {
    try {
        if (operation === 'add') {
            const mongoRecord = new MongoRecord({
                id: record.id,
                name: record.name,
                value: record.value,
                createdAt: new Date(),
                updatedAt: new Date()
            });
            await mongoRecord.save();
        } else if (operation === 'update') {
            await MongoRecord.findOneAndUpdate(
                { id: record.id },
                { 
                    name: record.name, 
                    value: record.value, 
                    updatedAt: new Date() 
                }
            );
        } else if (operation === 'delete') {
            await MongoRecord.findOneAndDelete({ id: record.id });
        }
    } catch (error) {
        console.log('❌ MongoDB sync error:', error.message);
    }
}

// NEW: Load data from MongoDB
async function loadFromMongoDB() {
    try {
        const mongoRecords = await MongoRecord.find().sort({ createdAt: -1 });
        if (mongoRecords.length > 0) {
            const fileData = mongoRecords.map(record => ({
                id: record.id,
                name: record.name,
                value: record.value
            }));
            fileDB.writeDB(fileData);
            console.log(`📁 Loaded ${mongoRecords.length} records from MongoDB`);
            return true;
        }
    } catch (error) {
        console.log('❌ Error loading from MongoDB:', error.message);
    }
    return false;
}

// NEW: Get MongoDB connection status
function getMongoDBStatus() {
    return mongoConnected;
}

// NEW: Get total records count
function getRecordsCount() {
    const data = fileDB.readDB();
    return data.length;
}

// NEW: Search records by keyword
function searchRecords(keyword) {
    const data = fileDB.readDB();
    const searchTerm = keyword.toLowerCase().trim();
    
    const results = data.filter(record => 
        record.name.toLowerCase().includes(searchTerm) || 
        record.value.toLowerCase().includes(searchTerm) ||
        record.id.toString().includes(searchTerm)
    );
    
    vaultEvents.emit('searchPerformed', keyword, results.length); // NEW EVENT
    return results;
}

// NEW: Get record by ID
function getRecordById(id) {
    const data = fileDB.readDB();
    return data.find(r => r.id === Number(id));
}

// NEW: Sort records function
function sortRecords(sortBy, order) {
    const data = fileDB.readDB();
    let sortedRecords = [...data];
    
    switch (sortBy) {
        case 'name':
            sortedRecords.sort((a, b) => order === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name));
            break;
        case 'date':
            sortedRecords.sort((a, b) => order === 'asc' ? a.id - b.id : b.id - a.id);
            break;
        default:
            return data;
    }
    
    vaultEvents.emit('sortPerformed', sortBy, order); // NEW EVENT
    return sortedRecords;
}

// NEW: Export data function
function exportData() {
    const data = fileDB.readDB();
    vaultEvents.emit('dataExported', data.length); // NEW EVENT
    return data;
}

// NEW: Create backup function  
function createBackup(backupFile) {
    const data = fileDB.readDB();
    vaultEvents.emit('backupCreated', backupFile); // NEW EVENT
    return data;
}

// NEW: Get statistics function
function getStatistics() {
    const data = fileDB.readDB();
    vaultEvents.emit('statisticsViewed', data.length); // NEW EVENT
    return data;
}

// Initialize MongoDB connection when module loads
connectMongoDB().then(connected => {
    if (connected) {
        loadFromMongoDB();
    }
});

module.exports = { 
    addRecord, 
    listRecords, 
    updateRecord, 
    deleteRecord,
    // NEW EXPORTS
    getMongoDBStatus,
    getRecordsCount,
    searchRecords,
    getRecordById,
    connectMongoDB,
    loadFromMongoDB,
    sortRecords,
    exportData,
    createBackup,
    getStatistics
};
