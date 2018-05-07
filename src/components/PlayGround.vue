<template>
  <div class="hello">
    <div>{{$route.params.room}}     {{Acc}}</div>
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
      </div>
      <div class="bet-middle">
        <div class="bet-middle-up">
          <div class="bet-small" @click="bet(betPrice,'small')">小</div>
          <div class="bet-tie" @click="bet(betPrice,'tie')">合</div>
          <div class="bet-big" @click="bet(betPrice,'big')">大</div>
        </div>
        <div class="bet-middle-down">
          <div class="player-odd" @click="bet(betPrice,'pOdd')">閒單</div>
          <div class="player-even" @click="bet(betPrice,'pEven')">閒雙</div>
          <div class="player-pair" @click="bet(betPrice,'pPair')">閒對</div>
          <div class="banker-pair" @click="bet(betPrice,'bPair')">莊對</div>
          <div class="banker-even" @click="bet(betPrice,'bEven')">莊雙</div>
          <div class="banker-odd" @click="bet(betPrice,'bOdd')">莊單</div>
        </div>
      </div>
      <div class="bet-banker" @click="bet(betPrice,'banker')">
        <span class="bet">莊家</span>
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

    betClear()
    {
      let clearData = {
        token:sessionStorage.token,
      };
      this.$socket.emit('betClear',clearData);
      
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
    showCards(cards)
    {
      console.log(cards);
      this.bankerCard = cards.banker;
      this.playerCard = cards.player;
    },

    showBet(showBet)
    {
      console.log(showBet);
    },

    moneyLeft(money)
    {
      if(money != 'notEnough')
      {
        this.money = money;
      }
    },

    betReturn(betReturn)
    {
      this.money = this.money + parseInt(betReturn.price);
      console.log('betReturn', betReturn, betReturn.by, betReturn.type);
    },

    disconnect()
    {
      this.$socket.emit('leaveRoom', sessionStorage.token);
    }
  },

  mounted() {
    this.roomName = this.$route.params.room;
    console.log(1,this.roomName);

    let joinData = {
      room: this.$route.params.room,
      token: sessionStorage.token,
    }

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
