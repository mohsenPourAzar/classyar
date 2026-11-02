import {config} from '../server/config.mjs';
import {openStore} from '../server/mongodb.mjs';
let store;
try{
  store=await openStore(config);
  console.log('MongoDB connection successful. Database: '+config.database);
  const state=await store.read();
  if(state)console.log('Stored records: '+['classes','students','modules','components','sessions','attendance','assessments','marks'].map(key=>key+'='+state[key].length).join(', '));
  else console.log('No classroom state yet. Start the app to initialize it.');
}catch{
  console.error('MongoDB connection failed. Check the MongoDB service and MONGODB_URI in .env.');
  process.exitCode=1;
}finally{await store?.close();}
