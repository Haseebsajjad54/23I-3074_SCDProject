const readline = require('readline');
const db = require('./db');
require('dotenv').config();
require('./events/logger'); // Initialize event logger

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
9. Create Manual Backup
10. Exit
=====================
  `);

  rl.question('Choose option: ', async (ans) => {
    switch (ans.trim()) {
      case '1':
        rl.question('Enter name: ', async (name) => {
          rl.question('Enter value: ', async (value) => {
            try {
              const record = await db.addRecord({ 
                name: name.trim(), 
                value: parseFloat(value) 
              });
              console.log('✅ Record added successfully!');
              console.log(`ID: ${record._id} | Name: ${record.name} | Value: ${record.value}`);
            } catch (error) {
              console.log(`❌ Error: ${error.message}`);
            }
            menu();
          });
        });
        break;

      case '2':
        try {
          const records = await db.listRecords();
          if (records.length === 0) {
            console.log('No records found.');
          } else {
            console.log(`\nTotal Records: ${records.length}`);
            console.log('----------------------------');
            records.forEach((r, i) => {
              console.log(`${i + 1}. ID: ${r._id} | Name: ${r.name} | Value: ${r.value} | Created: ${r.createdAt.toLocaleString()}`);
            });
          }
        } catch (error) {
          console.log(`❌ Error: ${error.message}`);
        }
        menu();
        break;

      case '3':
        rl.question('Enter record ID to update: ', async (id) => {
          rl.question('New name: ', async (name) => {
            rl.question('New value: ', async (value) => {
              try {
                const updated = await db.updateRecord(id.trim(), name.trim(), parseFloat(value));
                console.log(updated ? '✅ Record updated!' : '❌ Record not found.');
              } catch (error) {
                console.log(`❌ Error: ${error.message}`);
              }
              menu();
            });
          });
        });
        break;

      case '4':
        rl.question('Enter record ID to delete: ', async (id) => {
          try {
            const deleted = await db.deleteRecord(id.trim());
            console.log(deleted ? '🗑️ Record deleted!' : '❌ Record not found.');
          } catch (error) {
            console.log(`❌ Error: ${error.message}`);
          }
          menu();
        });
        break;

      case '5':
        rl.question('Enter search term (name or value): ', async (term) => {
          try {
            const results = await db.searchRecords(term.trim());
            if (results.length === 0) {
              console.log('No matching records found.');
            } else {
              console.log(`\nFound ${results.length} matching record(s):`);
              console.log('----------------------------------');
              results.forEach((r, i) => {
                console.log(`${i + 1}. ID: ${r._id} | Name: ${r.name} | Value: ${r.value} | Created: ${r.createdAt.toLocaleString()}`);
              });
            }
          } catch (error) {
            console.log(`❌ Error: ${error.message}`);
          }
          menu();
        });
        break;

      case '6':
        rl.question('Sort by (Name/CreatedAt): ', async (field) => {
          rl.question('Order (Ascending/Descending): ', async (order) => {
            try {
              const sorted = await db.sortRecords(field.trim(), order.trim());
              if (sorted.length === 0) {
                console.log('No records to sort.');
              } else {
                console.log(`\nSorted Records (${field} - ${order}):`);
                console.log('----------------------------------');
                sorted.forEach((r, i) => {
                  console.log(`${i + 1}. ID: ${r._id} | Name: ${r.name} | Value: ${r.value} | Created: ${r.createdAt.toLocaleString()}`);
                });
              }
            } catch (error) {
              console.log(`❌ Error: ${error.message}`);
            }
            menu();
          });
        });
        break;

      case '7':
        try {
          await db.exportVault();
          console.log('✅ Data exported to export.txt');
        } catch (error) {
          console.log(`❌ Error: ${error.message}`);
        }
        menu();
        break;

      case '8':
        try {
          await db.vaultStats();
        } catch (error) {
          console.log(`❌ Error: ${error.message}`);
        }
        menu();
        break;

      case '9':
        try {
          await db.backupVault();
          console.log('✅ Manual backup created');
        } catch (error) {
          console.log(`❌ Error: ${error.message}`);
        }
        menu();
        break;

      case '10':
        console.log('👋 Exiting NodeVault...');
        rl.close();
        process.exit(0);
        break;

      default:
        console.log('Invalid option.');
        menu();
        break;
    }
  });
}

// Start the application
console.log('🚀 Starting NodeVault with MongoDB...');
console.log('====================================');
menu();
