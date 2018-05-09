export class gameFunction{
    getCard(whoseCards, Cards)
    {
        let cardChose = Math.floor(Math.random() * Cards.length);
        whoseCards.push(Cards[cardChose]);
        Cards.splice(cardChose, 1);
    }

    findWin(playerNumber, bankerNumber)
    {
        if(playerNumber == bankerNumber)
            return 'tie';
        else if(playerNumber>bankerNumber)
            return 'player';
        else
            return 'banker';
    }
}
