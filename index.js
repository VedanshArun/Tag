const makeWASocket = require('@adiwajshing/baileys').default ;
const {DisconnectReason, useMultiFileAuthState} = require('@adiwajshing/baileys');

const store = {} ; 

const prodIds = []; 
const prodNumbers = []; 


const emIds = [];  
const emNumbers = []; 

const prIds = []; 
const prNumbers = []; 


const techIds = []; 
const techNumbers = []; 


const getMessage = (key) => {
    const {id} = key ; 
    if(store[id]) return store[id].message;
};

async function WAbot(){

    const {state, saveCreds} = await useMultiFileAuthState('auth');

    const sock = makeWASocket({
        printQRInTerminal: true, 
        auth : state ,
        getMessage,
    });

    
    const getText = (message) => {
        try{
            return (
                message.conversation || message.extendedTextMessage.text
            );

        }catch{
            return '';
        }
    };

    const getReactions = (message) => {
        try{
            return (
                message.reactionMessage.text
            );
        } catch{
            return '';
        }
    };

    const sendMessage = async (jid, content, ...args) => {
        try {
            const sent = await sock.sendMessage(jid,content, ...args) ; 
            store[sent.key.id] = sent ;
        } catch(err) {
            console.log("Error sending message : ", err);
        }

    };

    const handleMentions = async (msg) => {
        const {key, message} = msg ; 
        const text = getText(message) ; 

        const prefix  = '!varx' ; 
        if(!text.includes(prefix)) return;

        const reply = "Hi, I am a chatGPT bot made by varx"; 

        sendMessage(
            key.remoteJid,
            {text: reply},
            {quoted : msg}
        );


    };

    const handleAllTag = async (msg) => {
        const {key , message} = msg ; 
        const text = getText(message) ; 

        if(!text.toLowerCase().includes('$all')) return ; 

        const group = await sock.groupMetadata(key.remoteJid) ; 
        const members = group.participants ; 
        console.log(members);
        const mentions = [] ; 
        const numbers = [] ; 

        members.forEach(({id}) => {
            mentions.push(id) ;
            numbers.push(`@${id.slice(0,12)}`);
        });

        console.log(mentions);
        console.log(numbers);

        sendMessage(
            key.remoteJid,
            {text: "Hey" + numbers.join(" ") + " This is important for you",mentions},
            {quoted: msg}
        );
    };


    const setRoles = async (msg) => {
        const {key, message} = msg ; 

        const text = getText(message) ; 
        const reaction = getReactions(message) ; 

        
        console.log(reaction) ; 
    };

    const assignRoles = async (msg) => {
        
        const {key , message} = msg ; 

        const text = getText(message) ; 

        // const reaction = getReactions(message) ; 

        const participant = key.participant ; 

        if(text.toLowerCase().includes('$❤️')){
            if(prodIds.includes(participant)) return ;
            prodIds.push(participant) ; 
            prodNumbers.push(`@${participant.slice(0,12)}`);
            console.log(participant);
            console.log(prodIds,prodNumbers);
            return ; 
        }
        else if(text.toLowerCase().includes('$😂')){
            if(techIds.includes(participant)) return ; 
            techIds.push(participant) ; 
            techNumbers.push(`@${participant.slice(0,12)}`);
            return ;
        }
        else if(text.toLowerCase().includes('$🙏')){
            if(prIds.includes(participant)) return ; 
            prIds.push(participant) ; 
            prNumbers.push(`@${participant.slice( 0,12)}`);
            return ;
        }
        else if(text.toLowerCase().includes('$👍')){
            if(emIds.includes(participant)) return ;
            emIds.push(participant) ; 
            emNumbers.push(`@${participant.slice(0,12)}`);
            return ;
        }
        else return ; 

        if(text.toLowerCase().includes('$assign')){
            if(reaction === '❤️') {
                prodIds.push(participant) ; 
                prodNumbers.push(`@${participant.slice(0,12)}`);
                console.log(participant);
                console.log(prodIds,prodNumbers);
            
            }

            if(reaction === '😂') {
                techIds.push(participant) ; 
                techNumbers.push(`@${participant.slice(0,12)}`);
            
            }

            if(reaction === '🙏') {
                prIds.push(participant) ; 
                prNumbers.push(`@${participant.slice(0,12)}`);
            
            }

            if(reaction === '👍') {
                emIds.push(participant) ; 
                emNumbers.push(`@${participant.slice(0,12)}`);
            
            }
        };


    const handleTagRoles = async (msg) => {
        const {key, message} = msg ; 

        const text = getText(message);

        if(text.toLowerCase().includes('#design')){
            sendMessage(
                key.remoteJid,
                {text:"Hey " + prodNumbers.join(" ") + " This is important for you",prodIds},
                {quoted: msg}
            ); 
        }
        else if(text.toLowerCase().includes('#pr')){
            sendMessage(
                key.remoteJid,
                {text: "Hey " + prNumbers.join(" ") + " This is important for you",prIds},
                {quoted: msg}
            );
            return ; 
        }
    
        else if(text.toLowerCase().includes('#tech')){
            sendMessage(
                key.remoteJid,
                {text: "Hey " + techNumbers.join(" ") + " This is important for you",techIds},
                {quoted: msg}
            );
            return ;
        }
        else if(text.toLowerCase().includes('#em')){
            sendMessage(
                key.remoteJid,
                {text: "Hey " + emNumbers.join(" ") + " This is important for you",emIds},
                {quoted: msg}
            );
            return ; 
        }
        else return ;
    };

    sock.ev.process(async (events) => {
        if(events['connection.update']){
            const {connection, lastDisconnect} = events['connection.update'];
            if (connection === 'close'){
                if(lastDisconnect?.error?.output?.statusCodde !== DisconnectReason.loggedOut){
                    WAbot();
                } else {
                    console.log('Disconnected because you logged out') ; 
                }
            }
        }

        if(events['creds.update']) {
            await saveCreds();
        }

        if(events['messages.upsert']) {
            const {messages} = events['messages.upsert'] ; 
            messages.forEach(message =>{
                if(!message.message) return ; 
                console.log(message);
                handleMentions(message);
                handleAllTag(message);
                assignRoles(message);
                handleTagRoles(message);
            })
        }
    });
};

WAbot();