// backend/check-environment.js
import dotenv from 'dotenv';
dotenv.config();

console.log('🔍 Checking Environment Configuration...\n');

const requiredEnvVars = [
  'MYSQL_HOST',
  'MYSQL_USER', 
  'MYSQL_DATABASE',
  'MQTT_BROKER',
  'MQTT_USERNAME',
  'FIREBASE_PROJECT_ID',
  'JWT_SECRET'
];

let allValid = true;

requiredEnvVars.forEach(envVar => {
  if (!process.env[envVar]) {
    console.log(`❌ ${envVar}: NOT SET`);
    allValid = false;
  } else if (envVar.includes('PASSWORD') || envVar.includes('SECRET') || envVar.includes('KEY')) {
    console.log(`✅ ${envVar}: SET (hidden for security)`);
  } else {
    console.log(`✅ ${envVar}: ${process.env[envVar]}`);
  }
});

console.log('\n📊 Database Configuration:');
console.log(`   Host: ${process.env.MYSQL_HOST || 'NOT SET'}`);
console.log(`   Database: ${process.env.MYSQL_DATABASE || 'NOT SET'}`);
console.log(`   User: ${process.env.MYSQL_USER || 'NOT SET'}`);

console.log('\n📡 MQTT Configuration:');
console.log(`   Broker: ${process.env.MQTT_BROKER || 'NOT SET'}`);
console.log(`   Username: ${process.env.MQTT_USERNAME || 'NOT SET'}`);

console.log('\n🔐 Security Configuration:');
console.log(`   JWT Secret: ${process.env.JWT_SECRET ? 'SET' : 'NOT SET'}`);
console.log(`   Firebase Project: ${process.env.FIREBASE_PROJECT_ID || 'NOT SET'}`);

if (allValid) {
  console.log('\n🎉 All required environment variables are set!');
  console.log('🚀 You can start the backend server with: npm start');
} else {
  console.log('\n❌ Missing required environment variables!');
  console.log('💡 Check your .env file and ensure all variables are set.');
}