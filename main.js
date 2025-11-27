const readline = require('readline');
const db = require('./db');
const fs = require('fs');
const path = require('path');
require('./events/logger'); // Initialize event logger
require('dotenv').config();

// Create backups directory
const backupsDir = path.join(__dirname, 'backups');
if (!fs.existsSync(backupsDir)) {
  fs.mkdirSync(backupsDir);
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function menu() {
  console.log(`
===== NodeVault =====
1. Add Record
2. List Records
3. Update Record
4. Delete Record
5. Search Records
6. Sort Records
7. Export Data
8. View Vault Statistics
9. Exit
=====================
  `);

  rl.question('Choose option: ', ans => {
    switch (ans.trim()) {
      case '1':
        rl.question('Enter name: ', name => {
          rl.question('Enter value: ', value => {
            db.addRecord({ name, value });
            console.log('✅ Record added successfully!');
            createBackup();
            menu();
          });
        });
        break;

      case '2':
        const records = db.listRecords();
        if (records.length === 0) console.log('No records found.');
        else records.forEach(r => console.log(`ID: ${r.id} | Name: ${r.name} | Value: ${r.value}`));
        menu();
        break;

      case '3':
        rl.question('Enter record ID to update: ', id => {
          rl.question('New name: ', name => {
            rl.question('New value: ', value => {
              const updated = db.updateRecord(Number(id), name, value);
              console.log(updated ? '✅ Record updated!' : '❌ Record not found.');
              createBackup();
              menu();
            });
          });
        });
        break;

      case '4':
        rl.question('Enter record ID to delete: ', id => {
          const deleted = db.deleteRecord(Number(id));
          console.log(deleted ? '🗑️ Record deleted!' : '❌ Record not found.');
          createBackup();
          menu();
        });
        break;

      case '5':
        rl.question('Enter search keyword: ', keyword => {
          const results = db.searchRecords(keyword);
          if (results.length === 0) console.log('❌ No records found matching your search.');
          else {
            console.log(`\n🔍 Found ${results.length} matching record(s):`);
            results.forEach((r, index) => console.log(`${index + 1}. ID: ${r.id} | Name: ${r.name} | Value: ${r.value}`));
          }
          menu();
        });
        break;

      case '6':
        console.log(`
=== SORT OPTIONS ===
1. Sort by Name (Ascending)
2. Sort by Name (Descending)  
3. Sort by Creation Date (Ascending)
4. Sort by Creation Date (Descending)
        `);
        rl.question('Choose sort option (1-4): ', option => {
          const records = db.listRecords();
          let sortedRecords = [...records];
          
          switch (option.trim()) {
            case '1':
              sortedRecords.sort((a, b) => a.name.localeCompare(b.name));
              console.log('\n📈 Sorted by Name (Ascending):');
              break;
            case '2':
              sortedRecords.sort((a, b) => b.name.localeCompare(a.name));
              console.log('\n📉 Sorted by Name (Descending):');
              break;
            case '3':
              sortedRecords.sort((a, b) => a.id - b.id);
              console.log('\n📅 Sorted by Creation Date (Ascending):');
              break;
            case '4':
              sortedRecords.sort((a, b) => b.id - a.id);
              console.log('\n📅 Sorted by Creation Date (Descending):');
              break;
            default:
              console.log('❌ Invalid option.');
              menu();
              return;
          }
          
          if (sortedRecords.length === 0) console.log('📭 No records to display.');
          else sortedRecords.forEach((r, index) => console.log(`${index + 1}. ID: ${r.id} | Name: ${r.name} | Value: ${r.value}`));
          menu();
        });
        break;

      case '7':
        const allRecords = db.listRecords();
        const exportPath = path.join(__dirname, 'export.txt');
        const exportDate = new Date().toLocaleString();
        
        let exportContent = `=== NODEVAULT DATA EXPORT ===\n`;
        exportContent += `Export Date: ${exportDate}\n`;
        exportContent += `Total Records: ${db.getRecordsCount()}\n`;
        exportContent += `File: export.txt\n\n`;
        exportContent += `=== RECORDS ===\n`;
        
        if (allRecords.length === 0) {
          exportContent += 'No records found.\n';
        } else {
          allRecords.forEach((r, index) => {
            exportContent += `${index + 1}. ID: ${r.id} | Name: ${r.name} | Value: ${r.value}\n`;
          });
        }
        
        try {
          fs.writeFileSync(exportPath, exportContent);
          console.log(`✅ Data exported successfully to export.txt`);
          console.log(`📁 Location: ${exportPath}`);
        } catch (error) {
          console.log('❌ Error exporting data:', error.message);
        }
        menu();
        break;

      case '8':
        const statsRecords = db.listRecords();
        if (statsRecords.length === 0) {
          console.log('📭 No records available for statistics.');
          menu();
          return;
        }
        
        const longestName = statsRecords.reduce((longest, r) => r.name.length > longest.name.length ? r : longest, statsRecords[0]);
        const longestValue = statsRecords.reduce((longest, r) => r.value.length > longest.value.length ? r : longest, statsRecords[0]);
        const sortedByDate = [...statsRecords].sort((a, b) => a.id - b.id);
        const earliestRecord = sortedByDate[0];
        const latestRecord = sortedByDate[sortedByDate.length - 1];
        
        console.log('\n=== VAULT STATISTICS ===');
        console.log('---');
        console.log(`Total Records: ${db.getRecordsCount()}`);
        console.log(`Longest Name: ${longestName.name} (${longestName.name.length} characters)`);
        console.log(`Longest Value: ${longestValue.value} (${longestValue.value.length} characters)`);
        console.log(`Earliest Record: ${new Date(earliestRecord.id).toISOString().split('T')[0]}`);
        console.log(`Latest Record: ${new Date(latestRecord.id).toISOString().split('T')[0]}`);
        menu();
        break;

      case '9':
        console.log('👋 Exiting NodeVault...');
        rl.close();
        break;

      default:
        console.log('Invalid option.');
        menu();
    }
  });
}

// Automatic Backup System
function createBackup() {
  const records = db.listRecords();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0] + '_' + 
                    new Date().toTimeString().split(' ')[0].replace(/:/g, '-');
  const backupPath = path.join(backupsDir, `backup_${timestamp}.json`);
  
  const backupData = {
    timestamp: new Date().toISOString(),
    totalRecords: records.length,
    records: records
  };
  
  try {
    fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2));
    console.log(`💾 Backup created: backup_${timestamp}.json`);
  } catch (error) {
    console.log('❌ Error creating backup:', error.message);
  }
}

menu();
