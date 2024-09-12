import dbClient from './utils/db';

const waitConnection = () => {
    return new Promise((resolve, reject) => {
        let i = 0;
        const repeatFct = async () => {
            await setTimeout(() => {
                i += 1;
                if (i >= 10) {
                    reject()
                }
                else if(!dbClient.isAlive()) {
                    console.log('Repeating isalive');
                    repeatFct()
                }
                else {
                    resolve()
                }
            }, 1000);
        };
        repeatFct();
    })
};

(async () => {
    console.log('Is mongo alive:', dbClient.isAlive());
    await waitConnection();
    console.log('Is mongo alive:', dbClient.isAlive());
    console.log('No of users:', await dbClient.nbUsers());
    console.log('No of files:', await dbClient.nbFiles());
})();
