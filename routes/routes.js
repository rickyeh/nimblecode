import React from 'react';
import { Router, Route, hashHistory, IndexRoute, useRouterHistory } from 'react-router';
import { createHashHistory } from 'history';
import App from '../client/components/App.js';
import Singleplayer from '../client/containers/Singleplayer.js';
import Multiplayer from '../client/containers/Multiplayer.js';
import About from '../client/components/About';
import LandingPage from '../client/components/LandingPage';

const appHistory = useRouterHistory(createHashHistory)({ queryKey: false});

var routes = (
  <Router history={appHistory}>
    <Route path='/' component={App}>
      <IndexRoute component={LandingPage} />
      <Route path='/singleplayer' component={Singleplayer}/>
      <Route path='/singleplayer/:puzzleName' component={Singleplayer}/>
      <Route path='/about' component={About}/>
      <Route path='/multiplayer' component={Multiplayer}/>
    </Route>
  </Router>
);

module.exports = routes;