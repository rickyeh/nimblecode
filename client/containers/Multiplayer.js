import React, { Component } from 'react';
import CodeEditorMulti from './CodeEditorMulti';
import CodePromptMulti from '../components/CodePromptMulti';
import TimerMulti from './TimerMulti';
import levenshtein from './../lib/levenshtein';
import ProgressBarMulti from './ProgressBarMulti';
import { connect } from 'react-redux';
import { startGame, endGame, stopTimer, storeGameId, syncPlayersStatuses, startCountdown, getUsername } from '../actions/index';
import { bindActionCreators } from 'redux';
import underscore from 'underscore';

class Multiplayer extends Component {
  constructor() {
    super();

    this.state = {
      currentPuzzle: 'N/A',
      minifiedPuzzle: 'N/A',
      gameFinished: false,
      progress: 0
    };

  };

  componentWillMount() {
  };

  componentDidMount() {
    // console.log(this.props.params.gameId);

    this.socket = io();

    if(this.props.params.gameId){
      this.props.storeGameId(this.props.params.gameId);

      this.socket.emit('create new game', {roomcode:this.props.params.gameId, username: this.username});

      console.log('saved game is currently: ', this.props.savedGame);
    }

    // listen
    this.socket.on('player joined', function(players) {
      this.props.syncPlayersStatuses(players);
    }.bind(this));

    // listen
    this.socket.on('here is your prompt', function(prompt) {
      var minifiedPuzzle = prompt.replace(/\s/g,'');

      this.setState({
        currentPuzzle: prompt,
        minifiedPuzzle: minifiedPuzzle
      }).bind(this);

    }.bind(this));

    // listening for a 'all players progress' socket event and
    // collects all players' code from socket
    this.socket.on('all players progress', function(players) {
      underscore.map(players, function(obj, key){
        var playerPercent = this.calculatePercent(obj[2]);
        players[key][1] = playerPercent;
      }.bind(this));
      this.props.syncPlayersStatuses(players);

    }.bind(this));

    // listening for a 'game over' socket event to capture and stop time
    this.socket.on('game over', function(value) {
      console.log('inside socket on gameover, this.props.gameTime is: ', this.props.gameTime);
      var time = this.props.gameTime;
      underscore.once(this.saveTimeElapsed(time.tenthSeconds, time.seconds, time.minutes, value));

      this.props.stopTimer();
    }.bind(this));
  };

  componentWillUnmount() {
    this.socket.emit('disconnected',{roomcode:this.props.params.gameId, username: this.username})
    this.socket.disconnect();
  };

  componentDidUpdate() {
    // if player finishes the puzzle, ENDED_GAME action is sent, and 'game won' socket emitted
    if (this.props.multiGameState === 'ENDED_GAME') {
      var socketInfo = {
        username: this.username,
        id: this.socket.id,
        hasWon: true
      };
      underscore.once(this.socket.emit('game won', socketInfo, this.props.params.gameId));
    }
  };

  saveTimeElapsed(tenthSeconds, seconds, minutes, winner) {
    if (winner.id === this.socket.id) {
      // Sweet Alert with Info
      swal({
        title: 'Sweet!',
        text: 'You completed the challenge with a time of ' + minutes + ':' + seconds + '.' + tenthSeconds
      });
    } else {
      // if current player is not the winner, display winner's ID
      swal({
        title: 'Sorry!',
        text: winner.username + ' won with a time of ' + minutes + ':' + seconds + '.' + tenthSeconds
      });
    }
  };

  calculateProgress(playerCode) {

    var totalChars = this.state.minifiedPuzzle.length;
    var distance = levenshtein(this.state.minifiedPuzzle, playerCode);

    var percentCompleted = Math.floor(((totalChars - distance) / totalChars) * 100);

    this.setState({
      progress: percentCompleted
    });
  };

  calculatePercent(playerCode) {
    // typed code is passed in, and percent completed is calculated and returned
    var miniCode = playerCode.replace(/\s/g,'');
    var totalChars = this.state.minifiedPuzzle.length;
    var distance = levenshtein(this.state.minifiedPuzzle, miniCode);

    var percentCompleted = Math.floor(((totalChars - distance) / totalChars) * 100);
    return percentCompleted;
  };

  // sends current player's code to the socket to broadcast
  sendProgressToSockets(code, roomcode) {
    var data = {
      roomcode: roomcode,
      username: this.username,
      code: code
    }

    this.socket.emit('player progress', data);
  };

  render() {
    return (
      <div>
        <TimerMulti
          saveTimeElapsed={this.saveTimeElapsed.bind(this)}
          socket={this.socket} />
        <CodePromptMulti puzzle={this.state.currentPuzzle} />
        <CodeEditorMulti
          puzzle={this.state.currentPuzzle}
          minifiedPuzzle={this.state.minifiedPuzzle}
          calculateProgress={this.calculateProgress.bind(this)}
          sendProgressToSockets={this.sendProgressToSockets.bind(this)} />
        <ProgressBarMulti socket={this.socket} />
      </div>
    )
  };
};

function mapStateToProps(state) {
  return {
    multiGameState: state.multiGameState,
    gameTime: state.gameTime,
    savedGame: state.savedGame,
    playersStatuses: state.playersStatuses,
    SavedUsername: state.SavedUsername
  }
};

function mapDispatchToProps(dispatch) {
  return bindActionCreators({
    startGame: startGame,
    storeGameId: storeGameId,
    endGame: endGame,
    stopTimer: stopTimer,
    syncPlayersStatuses: syncPlayersStatuses,
    startCountdown: startCountdown,
    getUsername: getUsername
  }, dispatch);
};

export default connect(mapStateToProps, mapDispatchToProps)(Multiplayer);
