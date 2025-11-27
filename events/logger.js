const vaultEvents = require('./index');
const fs = require('fs');
const path = require('path');

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

// Function to write log to file
function writeLog(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  const logFile = path.join(logsDir, 'vault.log');
  
  try {
    fs.appendFileSync(logFile, logMessage);
  } catch (error) {
    console.log('❌ Error writing to log file:', error.message);
  }
}

// Record Added Event
vaultEvents.on('recordAdded', record => {
  const message = `Record added: ID ${record.id}, Name: ${record.name}, Value: ${record.value}`;
  console.log(`[EVENT] ${message}`);
  writeLog(`ADDED - ${message}`);
});

// Record Updated Event
vaultEvents.on('recordUpdated', record => {
  const message = `Record updated: ID ${record.id}, Name: ${record.name}, Value: ${record.value}`;
  console.log(`[EVENT] ${message}`);
  writeLog(`UPDATED - ${message}`);
});

// Record Deleted Event
vaultEvents.on('recordDeleted', record => {
  const message = `Record deleted: ID ${record.id}, Name: ${record.name}, Value: ${record.value}`;
  console.log(`[EVENT] ${message}`);
  writeLog(`DELETED - ${message}`);
});

// NEW: Search Event
vaultEvents.on('searchPerformed', (keyword, resultsCount) => {
  const message = `Search performed: Keyword "${keyword}", Found ${resultsCount} results`;
  console.log(`[EVENT] ${message}`);
  writeLog(`SEARCH - ${message}`);
});

// NEW: Sort Event
vaultEvents.on('sortPerformed', (sortBy, order) => {
  const message = `Sort performed: By ${sortBy}, Order: ${order}`;
  console.log(`[EVENT] ${message}`);
  writeLog(`SORT - ${message}`);
});

// NEW: Export Event
vaultEvents.on('dataExported', (recordCount) => {
  const message = `Data exported: ${recordCount} records`;
  console.log(`[EVENT] ${message}`);
  writeLog(`EXPORT - ${message}`);
});

// NEW: Backup Event
vaultEvents.on('backupCreated', (backupFile) => {
  const message = `Backup created: ${backupFile}`;
  console.log(`[EVENT] ${message}`);
  writeLog(`BACKUP - ${message}`);
});

// NEW: Statistics Viewed Event
vaultEvents.on('statisticsViewed', (totalRecords) => {
  const message = `Statistics viewed: ${totalRecords} total records`;
  console.log(`[EVENT] ${message}`);
  writeLog(`STATISTICS - ${message}`);
});

// NEW: MongoDB Connection Event
vaultEvents.on('mongoDBConnected', (status) => {
  const message = `MongoDB connection: ${status ? 'Connected' : 'Disconnected'}`;
  console.log(`[EVENT] ${message}`);
  writeLog(`MONGODB - ${message}`);
});

console.log('📝 Event logger initialized with enhanced logging...');
