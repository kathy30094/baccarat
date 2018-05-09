const express = require('express');
const app = express();

app.use(express.static(__dirname + '/dist'));
app.get('/', function(req, res){
    res.sendfile('index.html');
});

const server = require('http').Server(app);
const io = require('socket.io')(server);

const asyncRedis = require("async-redis");

const redisClient = asyncRedis.createClient();
redisClient.select(7);

const redisClient_token = asyncRedis.createClient();
redisClient_token.select(0);

var allCards = [];

io.on('connection', (socket) => {

    console.log('Hello!');

    async function betClear(data)
    {
        let memberData = await authAndGetAcc(data.token);

        let room = await redisClient.hget('member:'+memberData.id, 'room');

        let betReturnPrice = 0;

        let betThisRun = await redisClient.hget('member:'+memberData.id, 'betThisRun');
        if(betThisRun && betThisRun!=0)
        {
            await redisClient.hdel('member:'+memberData.id, 'betThisRun');
            let betOpctions = await redisClient.keys('betOn:'+room+'*');
            console.log('betOpctions', betOpctions);
            if(betOpctions)
            {
                for(let betSelect of betOpctions)
                {
                    let betPrice = await redisClient.hget(betSelect, memberData.id);
                    if(betPrice)
                    {
                        await redisClient.hdel(betSelect, memberData.id);

                        let total = await redisClient.hget(betSelect, 'total');
                        await redisClient.hset(betSelect, 'total', total - betPrice);

                        betReturnPrice = betReturnPrice + parseInt(betPrice);
                    }
                }
            }

            await addMoney(memberData.id, betReturnPrice);

            let moneyNow =  await redisClient.hget('member:'+memberData.id, 'money');

            let betReturn = {
                price: betReturnPrice,
                by: 'clear',
                type: 'clear',
                moneyNow: moneyNow,
            };

            socket.emit('betReturn', betReturn);

            let roomData = await getRoomData(room, memberData.id);
            io.to(room).emit('roomData',roomData);
        }
    }
    socket.on('betClear', async (data) => {
        await betClear(data);
    });

    socket.on('bet', async (betData) => {

        let memberData = await authAndGetAcc(betData.token);
        let room = await redisClient.hget('member:'+memberData.id, 'room');

        console.log(betData.betPrice, betData.betOn,memberData.Account);

        let money = await redisClient.hget('member:'+memberData.id, 'money');
        let moneyLeft = money - betData.betPrice;
        if(moneyLeft<0)
            socket.emit('moneyLeft', 'notEnough');
        else
        {
            await redisClient.hset('member:'+memberData.id, 'money', moneyLeft);

            let meBetThis = await addBet('betOn:'+room+':'+betData.betOn, memberData.Account, betData.betPrice);

            let totalBetThis = await addBet('betOn:'+room+':'+betData.betOn, 'total', betData.betPrice);

            let betThisRun = await addBet('member:'+memberData.id, 'betThisRun', betData.betPrice);

            let showBet = {
                betPeople: memberData.Account,
                bet: meBetThis,
                betOn: betData.betOn,
                totalBetThis: totalBetThis,
                betThisRun: betThisRun,
            }
            io.in(room).emit('showBet', showBet);
            socket.emit('moneyLeft', moneyLeft);
        }
    });

    socket.on('lobby',async (data) => {

        let memberData = await authAndGetAcc(data.token);
        
        //更新socket id
        await redisClient.set('socketId:'+socket.id,memberData.id);
        await redisClient.hset('member:'+memberData.id, 'socketid', socket.id);

        //if有room， check if不是 大廳 刪除room資料 
        let room = await redisClient.hget('member:'+memberData.id, 'room');

        //初次
        if(!room)
        {
            let money = await redisClient.hget('member:'+memberData.id, 'money');///////////////////////////////////需改為從某處拿資料
            if(!money)
                money =2000

            let accData = {
                Acc: memberData.Account,
                money: money, 
            }

            await redisClient.hmset('member:'+memberData.id, [
                'Acc', memberData.Account, 
                'token', data.token, 
                'money', money,
                'room', 'lobby'
            ]);

            socket.emit('memberData',accData);
            await redisClient.sadd('rooms:lobby', memberData.id);
        }
        else if(room!='lobby')
        {
            await redisClient.srem('rooms:'+room, memberData.id);
            await redisClient.hset('member:'+memberData.id, 'lobby', 'lobby');
            await redisClient.sadd('rooms:lobby', memberData.id);
            socket.leave(room);

            await betClear(data);
        }
    });

    socket.on('disconnect', async () => {
        //socket id & member id 對照刪除
        let memberId = await redisClient.get('socketId:'+socket.id);
        await redisClient.del('socketId:'+socket.id);
        await redisClient.hdel('member:'+memberId, socket.id);
    });

    // joinData = {
    //     room: this.$route.params.room,
    //     token: sessionStorage.token,
    //   }
    socket.on('joinRoom',async (joinData) =>{

        let memberData = await authAndGetAcc(joinData.token);
        let room = await redisClient.hget('member:'+memberData.id, 'room');

        let moneyLeft = await redisClient.hget('member:'+memberData.id, 'money');
            socket.emit('moneyLeft', moneyLeft);

        //一般加入
        if(joinData.room)
        {
            await redisClient.hset('member:'+memberData.id, 'room', joinData.room);
            socket.join(joinData.room);
            redisClient.sadd('rooms:'+joinData.room, memberData.id);
            redisClient.srem('rooms:lobby', memberData.id);
            room = joinData.room;
            await getRoomData(room, memberData.id);
        }
        //重整頁面 or 斷線重連
        else if(!joinData.room && room!='lobby' && room)
        {
            //更新socket id
            await redisClient.set('socketId:'+socket.id,memberData.id);
            await redisClient.hset('member:'+memberData.id, 'socketid', socket.id, )
            socket.join(room);

            console.log('roomNow', room);
            socket.emit('roomNow', room);
            await getRoomData(room, memberData.id);
        }
        else if(room =='lobby')
            console.log('error way to page');
    });

    

    socket.on('startGame', async (gameData) => {

        let memberData = await authAndGetAcc(gameData.token);
        let betThisRun = await redisClient.hget('member:'+memberData.id, 'betThisRun');
        console.log('startgame');

        if(betThisRun && betThisRun!=0)
        {

            let playerCards = [];
            let bankerCards = [];

            //全部的牌
            let Cards = [];
            Cards = Cards.concat(allCards);

            getCard(playerCards, Cards);
            getCard(bankerCards, Cards);

            getCard(playerCards, Cards);
            getCard(bankerCards, Cards);
            console.log(playerCards, bankerCards, Cards.length);

            //兩張牌數字
            var playerNumber = ( cardValue(playerCards[0]) + cardValue(playerCards[1]) ) % 10;
            var bankerNumber = ( cardValue(bankerCards[0]) + cardValue(bankerCards[1]) ) % 10;
            console.log(playerNumber, bankerNumber);

            //判斷發牌
            if(playerNumber<8 && bankerNumber <8)
            {
                var bH = 0;

                if(playerNumber==6||playerNumber==7) //玩家不補牌的狀況
                {
                    if(bankerNumber <= 6) //判斷莊家是否要補
                        bH=1;
                }
                else if(playerNumber<6)//玩家補牌的狀況
                {
                    getCard(playerCards, Cards);
                    let playerCard3Value = cardValue(playerCards[2])
                    playerNumber = (playerNumber+ playerCard3Value)%10;
                    console.log(playerCard3Value);

                    if(bankerNumber <=2) //判斷莊家是否要補
                        bH=1;

                    switch(bankerNumber){
                        case 3:
                            if(playerCard3Value!=8)
                                bH=1;
                            break;
                        case 4:
                            if(playerCard3Value>=2 && playerCard3Value<=7)
                                bH=1;
                            break;
                        case 5:
                            if(playerCard3Value>=4 && playerCard3Value<=7)
                                bH=1;
                        case 6:
                            if(playerCard3Value>=6 && playerCard3Value<=7)
                                bH=1;
                            break;
                    }
                }

                if(bH == 1 )
                {
                    getCard(bankerCards, Cards);
                    bankerNumber = (bankerNumber + cardValue(bankerCards[2]))%10;
                }
            }
            
            let theWins = [];
            let theWin = findWin(playerNumber, bankerNumber);
            theWins.push(theWin);

            console.log(playerCards, bankerCards);
            console.log(playerNumber, bankerNumber);
            console.log(findWin(playerNumber, bankerNumber));

            let room = await redisClient.hget('member:'+memberData.id, 'room');
            
            let showCards = {
                player: playerCards,
                banker: bankerCards,
            };
            io.in(room).emit('showCards', showCards);
            //socket.emit('showCards', showCards);

            //閒對
            if(playerCards[0].slice(1) == playerCards[1].slice(1))
                theWins.push('pPair');
            //莊對
            if(bankerCards[0].slice(1) == bankerCards[1].slice(1))
                theWins.push('bPair');
            //閒單 //閒雙
            if(playerNumber%2 == 1)
                theWins.push('pOdd');
            else
                theWins.push('pEven');
            //莊單 //莊雙
            if(bankerNumber%2 == 1)
                theWins.push('bOdd');
            else
                theWins.push('bEven');
            //大 //小
            if(playerCards.length + bankerCards.length == 4)
                theWins.push('small');
            else
                theWins.push('big');

            for(let theWin of theWins)
            {
                let times = 0;
                switch(theWin){
                    case 'banker':
                        times = 1.95;
                        break;
                    case 'player':
                        times = 2;
                        break;
                    case 'tie':
                        times = 8;
                        break;
                    case 'bOdd':
                        times = 1.95;
                        break;
                    case 'pOdd':
                        times = 1.92;
                        break;
                    case 'pPair':
                        times = 12;
                        break;
                    case 'bPair':
                        times = 12;
                        break;
                    case 'bEven':
                        times = 1.88;
                        break;
                    case 'pEven':
                        times = 1.92;
                        break;
                    case 'big':
                        times = 1.53;
                        break;
                    case 'small':
                        times = 2.45;
                        break;
                }

                winnersObj = await redisClient.hgetall('betOn:'+room+':'+theWin);
                console.log('winnersObj', winnersObj);

                if(winnersObj)
                {
                    let winners = Object.keys(winnersObj);
                    console.log(winners);

                    for(let memberWin of winners)
                    {
                        if (memberWin!='total')
                        {
                            betReturnPrice = times * winnersObj[memberWin]
                            await addMoney(memberWin, betReturnPrice);

                            let moneyNow =  await redisClient.hget('member:'+memberWin, 'money');
                            let betReturn = {
                                price: betReturnPrice,
                                by: theWin,
                                type: 'win',
                                moneyNow: moneyNow,
                            };

                            let socketid = await redisClient.hget('member:'+memberWin, 'socketid');

                            socket.broadcast.to(socketid).emit('betReturn', betReturn);
                            if(socket.id == socketid)
                                socket.emit('betReturn', betReturn);
                        }
                    }
                }
            }
            
            //清除所有bet
            bets = await redisClient.keys('betOn:'+room+'*');
            redisClient.del(bets);

            //清除betThisRun
            let membersInRoom = await redisClient.smembers('rooms:'+room);
            console.log('membersInRoom',membersInRoom);

            for(let member of membersInRoom)
            {
                await redisClient.hdel('member:'+member, 'betThisRun');
            }

            io.to(room).emit('newGame');
        }
    });

    async function getRoomData(room, memberId){
        
        let betOns = await redisClient.keys('betOn:'+room+':*');
        console.log(betOns);
        let roomData = [];
        for(let betOn of betOns)
        {
            let betTotal = await redisClient.hget(betOn, 'total');
            let mybet = await redisClient.hget(betOn, memberId);
            let theBet = betOn.slice(('betOn:'+room+':').length)

            roomData.push({betTotal: betTotal, mybet: mybet, theBet: theBet});
        }
        socket.emit('roomData',roomData);
        console.log(roomData);
        return roomData;
    }

    async function addMoney(memberId, moneyToAdd)
    {
        memberMoney = await redisClient.hget('member:'+memberId,'money');
        await redisClient.hset('member:'+memberId,'money', parseInt(memberMoney) + parseInt(moneyToAdd));
    }

    function getCard(whoseCards, Cards)
    {
        let cardChose = Math.floor(Math.random() * Cards.length);
        whoseCards.push(Cards[cardChose]);
        Cards.splice(cardChose, 1);
    }

    function findWin(playerNumber, bankerNumber)
    {
        if(playerNumber == bankerNumber)
            return 'tie';
        else if(playerNumber>bankerNumber)
            return 'player';
        else
            return 'banker';
    }

    async function authAndGetAcc(token)
    {
        var res = await redisClient_token.get(token);

        if(res != null)
        {
            data = JSON.parse(res);
            //console.log(res);
            return data;
        }
        else
        {
            memberData = {};
            // socket.emit('notLogined');
            return false;
        }
    }

    function cardValue(card)
    {  
        let cardNum = parseInt(card.slice(1));
        let cardValue = (cardNum<10) ? cardNum : 0;
        return cardValue;
    }

    async function addBet(key, key1, betPrice)
    {
        totalBet = JSON.parse(await redisClient.hget(key, key1));
        if(totalBet)
        {
            totalBet = totalBet + betPrice;
            await redisClient.hset(key, key1, totalBet);
            return totalBet;
        }
        else
        {
            await redisClient.hset(key, key1, betPrice);
            return betPrice;
        }
    }
});

server.listen(7000, async (req, res) => {
    console.log("server started. http://localhost:7000");
    let cardNum = 6;
    let colors = ['s','h','d','c'];
    allCards = [];

    let card52 = [];
    for(let j = 0; j<4; j++)
    {
        let card13 = [];
        for(let k = 1; k<=13; k++)
            card13.push(colors[j]+k.toString());
        card52 = card52.concat(card13);
    }

    for(let i = 1; i <= cardNum; i ++)
        allCards = allCards.concat(card52);

    redisClient.flushdb();
});
