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
    
    socket.on('betClear', async (data) => {

        let memberData = await authAndGetAcc(data.token);

        let room = await redisClient.hget('member:'+memberData.id, 'room');

        let betReturn = 0;

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

                        betReturn = betReturn + parseInt(betPrice);
                    }
                }
            }
            await addMoney(memberData.id, betReturn);
            socket.emit('betReturn', betReturn);
        }

    });

    async function addMoney(memberId, moneyToAdd)
    {
        memberMoney = await redisClient.hget('member:'+memberId,'money');
        await redisClient.hset('member:'+memberId,'money', parseInt(memberMoney) + parseInt(moneyToAdd));
    }

    socket.on('bet', async (betData) => {

        let memberData = await authAndGetAcc(betData.token);
        let room = await redisClient.hget('member:'+memberData.id, 'room');

        console.log(betData.betPrice, betData.betOn,memberData.Account);

        let money = await redisClient.hget('member:'+memberData.id, 'money');
        let moneyLeft = money - betData.betPrice;
        if(moneyLeft<0)
            $socket.emit('moneyLeft', 'notEnough');
        else
        {
            await redisClient.hset('member:'+memberData.id, 'money', moneyLeft);

            let meBetThis = await addBet('betOn:'+room+':'+betData.betOn, memberData.Account, betData.betPrice);

            let totalBetThis = await addBet('betOn:'+room+':'+betData.betOn, 'total', betData.betPrice);

            let betThisRun = await addBet('member:'+memberData.id, 'betThisRun', betData.betPrice);

            let showBet = {
                betPeople: memberData.Account,
                meBetThis: meBetThis,
                betOn: betData.betOn,
                totalBetThis: totalBetThis,
                betThisRun: betThisRun,
            }
            io.in(room).emit('showBet', showBet);
            socket.emit('moneyLeft', moneyLeft);
        }
    });

    socket.on('isOnline',async (data) => {
        let memberData = await authAndGetAcc(data.token);
        let money = await redisClient.hget('member:'+memberData.id, 'money');///////////////////////////////////需改為從某處拿資料
        if(!money)
        {
            money =2000
        }

        let accData = {
            Acc: memberData.Account,
            money: money, 
        }

        await redisClient.hmset('member:'+memberData.id, [
            'Acc', memberData.Account, 
            'socketid', socket.id, 
            'token', data.token, 
            'money', money
        ]);

        socket.emit('memberData',accData);
    });


    // joinData = {
    //     room: this.$route.params.room,
    //     token: sessionStorage.token,
    //   }
    socket.on('joinRoom',async (joinData) =>{
        let memberData = await authAndGetAcc(joinData.token);

        await redisClient.hset('member:'+memberData.id, 'room', joinData.room);
        socket.join(joinData.room);
        redisClient.sadd('rooms:'+joinData.room, memberData.id);

    });

    socket.on('startGame', async (gameData) => {

        let betThisRun = await redisClient.hget('member:'+memberData.id, 'betThisRun');
        if(betThisRun && betThisRun!=0)
        {
            let memberData = await authAndGetAcc(gameData.token);

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
            var playerNumber = (playerCards[0]+playerCards[1])%10;
            var bankerNumber = (bankerCards[0]+bankerCards[1])%10;
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
                    playerNumber = (playerNumber+playerCards[2])%10;

                    if(bankerNumber <=2) //判斷莊家是否要補
                        bH=1;

                    switch(bankerNumber){
                        case 3:
                            if(playerCards[2]!=8)
                                bH=1;
                            break;
                        case 4:
                            if(playerCards[2]>=2 && playerCards[2]<=7)
                                bH=1;
                            break;
                        case 5:
                            if(playerCards[2]>=4 && playerCards[2]<=7)
                                bH=1;
                        case 6:
                            if(playerCards[2]>=6 && playerCards[2]<=7)
                                bH=1;
                            break;
                    }
                }

                if(bH == 1 )
                {
                    getCard(bankerCards, Cards);
                    bankerNumber = (bankerNumber+bankerCards[2])%10;
                }
            }

            
            theWin = findWin(playerNumber, bankerNumber);
            console.log(playerCards, bankerCards);
            console.log(playerNumber, bankerNumber);
            console.log(findWin(playerNumber, bankerNumber));

            let times = 0;
            switch(theWin){
                case 'banker':
                    times = 1.95;
                    break;
                case 'player':
                    times = 2;
                    break;
                case 'even':
                    times = 8;
                    break;
            }

            let room = await redisClient.hget('member:'+memberData.id, 'room');

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
                        let betReturn = times * winnersObj[memberWin];
                        await addMoney(memberWin, betReturn);

                        let socketid = await redisClient.hget('member:'+memberWin, 'socketid');

                        socket.broadcast.to(socketid).emit('betReturn', betReturn);
                        if(socket.id == socketid)
                            socket.emit('betReturn', betReturn);
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
        }
    });

    function getCard(whoseCards, Cards)
    {
        let cardChose = Math.floor(Math.random() * Cards.length);
        whoseCards.push(Cards[cardChose]);
        Cards.splice(cardChose, 1);
    }

    function findWin(playerNumber, bankerNumber)
    {
        if(playerNumber == bankerNumber)
            return 'even';
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
    let card13 = [1,2,3,4,5,6,7,8,9,10,11,12,13];
    allCards = [];
    for(let i = 1; i <= cardNum*4; i ++)
        allCards = allCards.concat(card13);
    redisClient.flushdb();
});
