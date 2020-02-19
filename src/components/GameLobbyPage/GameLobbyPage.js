import React, { Component } from 'react'
import DrawingPage from '../DrawingPage/DrawingPage'
import GuessingPage from '../GuessingPage/GuessingPage'
import DigiDoodleApiService from '../../services/digi-doodle-api-service';
import ColorContext from '../../Context/ColorContext';
import Cookies from 'js-cookie';
import socket from '../../services/socket-service';
import './GameLobbyPage.css'

        
export default class GameLobbyPage extends Component {
    constructor(props) {
        super(props);
        this.state = {
            isDrawing: false
        }
    }

    static contextType = ColorContext

    async componentDidMount() {
        let cookie = Cookies.get();
        let data = JSON.parse(cookie['digi-doodle-user']);

        await this.context.setGameId(data.gameId)
        await this.context.setUserName(data.username)
        await this.context.setUserId(data.userId)

        socket.emit('sendRoom', `${data.gameId}`);
        socket.emit('start check', 'player in room');
        socket.emit('get game', 'gimme that sweet, sweet game')

        socket.on('chat message', msg => {
            console.log('from server: ', msg);
        })

        socket.on('chat response', (msg) => {
            this.context.setMessages({ 
                 messages: [...this.context.messages, msg]
             });
         })

        socket.on('send game', async (gameData) => {
            console.log('gamedata from server: ', gameData);
            await this.context.setGame(gameData);
        })

        socket.on('announcement', (announcement) => {
            this.setState({
                correct: true
            })
        })

        DigiDoodleApiService.getWordPrompt()
            .then(res => {
                this.context.getPrompt(res.prompt)
            })
        DigiDoodleApiService.getAllPlayersInGame(data.gameId)
            .then(playersArray => {
                this.context.setPlayers(playersArray)
            })
    }

    componentWillUnmount(){
        socket.close();
    }

    swapIsDrawing = async () => {
        await this.setState({
            isDrawing: !this.state.isDrawing
        })
        await this.context.swapDrawing();
    }

    render() {

        return (
            <div>
                {!this.context.isDrawing && <GuessingPage />}
                {this.context.isDrawing && <DrawingPage />}
                <button onClick={this.swapIsDrawing}>Swap Drawing/Guessing Views</button>
            </div>
        )
    }
}