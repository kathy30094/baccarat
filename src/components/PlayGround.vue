<template>
  <div class="hello">
    <div>{{roomName}}     {{Acc}}</div>
    <router-link to="/" ><span @click="leaveRoom">回大廳</span></router-link>
    <div class="card-place">
      <div class="player-card">
        <span class="card">閒家</span> 
        <br>
        <span id="playerCard1">{{playerCard}}</span>
        
      </div>
      <div class="banker-card">
        <span class="card">莊家</span>
        <br>
        <span id="bankerCard1">{{bankerCard}}</span>
      </div>
    </div>
    <div class="bet-place">
      <div class="bet-player" @click="bet(betPrice,'player')">
        <span class="bet">閒家</span>
        <br>
        me : {{mybet.player}}
        <br>
        all : {{allbet.player}}
      </div>
      <div class="bet-middle">
        <div class="bet-middle-up">
          <div class="bet-small" @click="bet(betPrice,'small')">小
            <br>
            me : {{mybet.small}}
            <br>
            all : {{allbet.small}}
          </div>
          <div class="bet-tie" @click="bet(betPrice,'tie')">合
            <br>
            me : {{mybet.tie}}
            <br>
            all : {{allbet.tie}}
          </div>
          <div class="bet-big" @click="bet(betPrice,'big')">大
            <br>
            me : {{mybet.big}}
            <br>
            all : {{allbet.big}}
          </div>
        </div>
        <div class="bet-middle-down">
          <div class="player-odd" @click="bet(betPrice,'pOdd')">閒單
            <br>
            me : {{mybet.pOdd}}
            <br>
            all : {{allbet.pOdd}}
          </div>
          <div class="player-even" @click="bet(betPrice,'pEven')">閒雙
            <br>
            me : {{mybet.pEven}}
            <br>
            all : {{allbet.pEven}}
          </div>
          <div class="player-pair" @click="bet(betPrice,'pPair')">閒對
            <br>
            me : {{mybet.pPair}}
            <br>
            all : {{allbet.pPair}}
          </div>
          <div class="banker-pair" @click="bet(betPrice,'bPair')">莊對
            <br>
            me : {{mybet.bPair}}
            <br>
            all : {{allbet.bPair}}
          </div>
          <div class="banker-even" @click="bet(betPrice,'bEven')">莊雙
            <br>
            me : {{mybet.bEven}}
            <br>
            all : {{allbet.bEven}}
          </div>
          <div class="banker-odd" @click="bet(betPrice,'bOdd')">莊單
            <br>
            me : {{mybet.bOdd}}
            <br>
            all : {{allbet.bOdd}}
          </div>
        </div>
      </div>
      <div class="bet-banker" @click="bet(betPrice,'banker')">
        <span class="bet">莊家</span>
        <br>
            me : {{mybet.banker}}
            <br>
            all : {{allbet.banker}}
      </div>
    </div>
    <div class="buttom">
      <div class="money10" @click="betPrice=10">10</div>
      <div class="money100" @click="betPrice=100">100</div>
      <div class="money1000" @click="betPrice=1000">1000</div>
      <div class="bet-clear" @click="betClear">clear</div>
      <div class="money">{{money}}</div>
      <div class="start" @click="startGame">START</div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'HelloWorld',
  data () {
    return {
      money: 0,
      roomName: '',
      betPrice: 10,
      Acc: '',
      playerCard: [],
      bankerCard: [],
      mybet: {
        tie: 0,
        banker: 0,
        player: 0,
        small: 0,
        big: 0,
        bOdd: 0,
        pPair: 0,
        bEven: 0,
        pEven: 0,
        pOdd: 0,
        bPair: 0,
      },
      allbet: {
        tie: 0,
        banker: 0,
        player: 0,
        small: 0,
        big: 0,
        bOdd: 0,
        pPair: 0,
        bEven: 0,
        pEven: 0,
        pOdd: 0,
        bPair: 0,
      },
    }
  },

  methods: {

    bet(betPrice,betOn)
    {
      console.log(betPrice,betOn);
      let betData = {
        betPrice: betPrice,
        betOn: betOn,
        token: sessionStorage.token,
      };
      this.$socket.emit('bet',betData);
    },

    leaveRoom()
    {
      this.$socket.emit('leaveRoom')
    },

    betClear()
    {
      let clearData = {
        token:sessionStorage.token,
      };
      this.$socket.emit('betClear',clearData);
      let mybetkey = Object.keys(this.mybet);
      for(let bet of mybetkey)
        this.mybet[bet] = 0;
    },

    startGame()
    {
      let gameData = {
        token: sessionStorage.token,
      }
      this.$socket.emit("startGame",gameData);
    },

  },

  sockets: {

    newGame()
    {
      let mybetkey = Object.keys(this.mybet);
      for(let bet of mybetkey)
        this.mybet[bet] = 0;
      let allbetkey = Object.keys(this.allbet);
      for(let bet of allbetkey)
        this.allbet[bet] = 0;
    },

    roomData(roomData)
    {
      console.log(roomData);
      if(roomData.length!=0)
      {
        for(let bet of roomData)
        {
          if(bet.betTotal)
            this.allbet[bet.theBet] = bet.betTotal;
          if(bet.mybet)
            this.mybet[bet.theBet] = bet.mybet;
        }
      }
      
    },
    
    roomNow(roomNow)
    {
      this.roomName = roomNow;
    },

    showCards(cards)
    {
      console.log(cards);
      this.bankerCard = cards.banker;
      this.playerCard = cards.player;
    },

    showBet(showBet)
    {
      //betPeople: "11", bet: 100, betOn: "bOdd", totalBetThis: 110, betThisRun: 700
      console.log(showBet);
      if(showBet.betPeople==sessionStorage.Acc)
        this.mybet[showBet.betOn] = showBet.bet;
      this.allbet[showBet.betOn] = showBet.totalBetThis;
    },

    moneyLeft(money)
    {
      if(money != 'notEnough')
      {
        this.money = money;
      }
      console.log(money);
    },

    betReturn(betReturn)
    {
      this.money = betReturn.moneyNow;
      console.log('add',this.money+betReturn.price);
      console.log('betReturn', betReturn);
    },
  },

  mounted() {
    this.roomName = this.$route.params.room;
    console.log(1,this.roomName);

    let joinData = {
      room: this.$route.params.room,
      token: sessionStorage.token,
    };

    this.money=this.$route.params.money;
    this.Acc= sessionStorage.Acc;

    this.$socket.emit('joinRoom', joinData);
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style>

html, body, #app, .hello {
  height: 100%;
  background-color: #0f8550;
}
h1, h2 {
  font-weight: normal;
}
.hello{
  width: 100%;
  background-color: #0f8550;
}

.card-place{
  display: inline-block;
  height: 40%;
  width: 100%;
}
  .player-card{
    display: inline-block;
    background-color:#0f8550;
    height: 100%;
    width: 50%;
    float: left;
  }
  .banker-card{
    display: inline-block;
    background-color:#0f8550;
    height: 100%;
    width: 50%;
    float: right;
  }
  .card{
    color: #f3f5f4;
    font-size: 30px;
  }


.bet-place{
  background-color:#0f8550;
  height: 40%;
  width: 85%;
  left: 7.5%;
  position: relative;
}
  .bet-player{
    position: relative;
    top: 10%;
    float: left;
    height: 70%;
    width: 20%;
    border: 2px solid #dbcd8b;
    border-radius: 10px;
  }
  .bet-banker{
    position: relative;
    top: 10%;
    float: right;
    height: 70%;
    width: 20%;
    border: 2px solid #dbcd8b;
    border-radius: 10px;
  }
  .bet-middle{
    position: relative;
    top: 10%;
    float: left;
    left: 2%;
    height: 70%;
    width: 55%;
    border: 2px solid #dbcd8b;
    border-radius: 10px;
  }
    .bet-middle-up{
      height: 50%;
    }
    .bet-small{
      float: left;
      height: 100%;
      width: 33%;
      border-right: 2px solid #dbcd8b;
    }
    .bet-tie{
      float: left;
      height: 100%;
      width: 33%;
      border-right: 2px solid #dbcd8b;
    }
    .bet-big{
      float: left;
      height: 100%;
      width: 32%;
    }
  .bet-middle-down{
    height: 50%;
    border-top: 2px solid #dbcd8b;
  }
    .player-odd{
      float: left;
      height: 100%;
      width: 16.3%;
      border-right: 2px solid #dbcd8b;
    }
    .player-even{
      float: left;
      height: 100%;
      width: 16.3%;
      border-right: 2px solid #dbcd8b;
    }
    .player-pair{
      float: left;
      height: 100%;
      width: 16.3%;
      border-right: 2px solid #dbcd8b;
    }
    .banker-pair{
      float: left;
      height: 100%;
      width: 16.3%;
      border-right: 2px solid #dbcd8b;
    }
    .banker-even{
      float: left;
      height: 100%;
      width: 16.3%;
      border-right: 2px solid #dbcd8b;
    }
    .banker-odd{
      float: left;
      height: 100%;
      width: 14.5%;
    }

.buttom{
  background-color:#0f8550;
  height: 10%;
  width: 100%;
}
  .money10{
    position: relative;
    float: left;
    left: 10%;
    height: 60px;
    width: 60px;
    border: 2px solid #dbcd8b;
    border-radius: 30px;
  }
  .money100{
    position: relative;
    float: left;
    left: 12%;
    height: 60px;
    width: 60px;
    border: 2px solid #dbcd8b;
    border-radius: 30px;
  }
  .money1000{
    position: relative;
    float: left;
    left: 14%;
    height: 60px;
    width: 60px;
    border: 2px solid #dbcd8b;
    border-radius: 30px;
  }
  .bet-clear{
    position: relative;
    float: left;
    left: 16%;
    height: 60px;
    width: 60px;
    border: 2px solid #dbcd8b;
    border-radius: 30px;
  }
  .start{
    position: relative;
    float: right;
    right: 5%;
    height: 70px;
    width: 70px;
    border: 2px solid #dbcd8b;
    border-radius: 40px;
  }



</style>
