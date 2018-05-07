<template>
    <div class="hello">
        <router-link :to="{name: 'PlayGround', params: {room: 'room1', money: money, Acc: Acc}}">room1</router-link>
        <br>
        <router-link :to="{name: 'PlayGround', params: {room: 'room2', money: money, Acc: Acc}}">room2</router-link>
        <br>
        <router-link :to="{name: 'PlayGround', params: {room: 'room3', money: money, Acc: Acc}}">room3</router-link>
        <br>
    </div>
</template>

<script>
export default {
    name: 'HelloWorld',
    data () {
        return {
            money: 0,
            Acc: '',
        }
    },

    methods: {
        
    },

    sockets: {

        // data = {
        //     Acc: memberData.Account,
        //     money: 2000,
        // }
        memberData(data) {
            console.log(JSON.stringify(data));
            this.money=data.money;
            this.Acc = data.Acc;
            sessionStorage.Acc = this.Acc;
        },

        connect()
        {
            
        },
    },

    mounted() {
        var theToken = window.name;

        if(sessionStorage.token !=null)
        {
            this.$socket.emit('leaveRoom');
        }

        if(sessionStorage.token == null || theToken)
            sessionStorage.setItem('token',theToken);
        window.name = '';
        console.log(typeof theToken);

        let connectData = {
            token: sessionStorage.token,
        }
        this.$socket.emit('isOnline',connectData);
    }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style>
html, body, #app, .hello {
    height: 100%;
    background-color: #ffffff;
}
.hello {
    width: 100%;
    
}
</style>
