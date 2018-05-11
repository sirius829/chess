import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Redirect } from 'react-router-dom';
import io from 'socket.io-client';

import data from '../assets/data';

const { baseAPI } = data;

class Home extends Component {
  state = {
    error: null,
    gameId: null,
    waiting: false,
    whiteId: null,
  }

  componentDidMount() {
    this.socket = io(baseAPI);

    this.socket.on('connection', () => {
      console.log('CONNECTED');
    });

    // TODO: this is a bug
    this.socket.on('START_GAME', (game) => {
      console.log('START GAME', game);
      this.startGame(game);
    });
  }

  componentWillUnmount() {
    this.socket.close();
  }

  createGame = () => {
    const { user } = this.props;
    const data = {
      userId: user.id,
      username: user.username,
    };
    this.socket.emit('CREATE_GAME', data);
    this.setState({ waiting: true }, () => {
      setTimeout(() => {
        this.socket.on('RECEIVE_GAME', (game) => {
          console.log('RECEIVE GAME', game);
          this.receiveGame(game);
        });
      }, 1000);
      this.stopWaiting = setTimeout(() => {
        this.socket.removeListener('RECEIVE_GAME');
        this.setState({
          error: 'Could not find an opponent at this time',
          waiting: false,
        });
        setTimeout(() => {
          this.setState({ error: null });
        }, 2000);
      }, 5000);
    });
  }

  receiveGame = (game) => {
    clearTimeout(this.stopWaiting);
    this.setState({ waiting: false }, () => {
      this.socket.removeListener('RECEIVE_GAME');
      this.socket.emit('JOIN_GAME', game);
    });
    this.setState({
      gameId: game.id,
      whiteId: game.userId,
    });
  }

  startGame = (game) => {
    if (game.userId === this.props.user.id) {
      this.setState({
        gameId: game.id,
        whiteId: game.userId,
      });
    }
  }

  render() {
    const {
      error,
      gameId,
      waiting,
      whiteId,
    } = this.state;
    const redirect = gameId ?
      <Redirect to={`/game/${gameId}?start_id=${whiteId}`} />
      :
      null;

    const buttonText = waiting ? 'Looking for Opponent' : 'Start a Game';
    const errorMessage = error ?
      (
        <p style={{ color: 'red' }}>{error}</p>
      ) : null;

    return (
      <div className="Home">
        {redirect}
        <h1>Home Component</h1>
        <button
          disabled={waiting}
          onClick={this.createGame}
        >
          {buttonText}
        </button>
        {errorMessage}
      </div>
    );
  }
}

const mapStateToProps = state => ({
  user: state.userReducer.user,
});

const mapDispatchToProps = dispatch => ({
  addGame: (game) => {
    const action = { type: 'ADD_GAME', game };
    dispatch(action);
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(Home);