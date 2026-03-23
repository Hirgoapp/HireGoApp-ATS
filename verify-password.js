const bcrypt = require('bcrypt');

const hash = '$2b$10$YbjGTNwmqc2qwFoCrOaJW.097BbW6.kaqRTDqE2qhBCOUbi.vLNDC';
const password = 'SuperAdmin123!';

bcrypt.compare(password, hash).then(result => {
    console.log('Password:', password);
    console.log('Hash:', hash);
    console.log('Match:', result);
    process.exit(result ? 0 : 1);
}).catch(err => {
    console.error('Error:', err);
    process.exit(1);
});
