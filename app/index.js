import 'babel-polyfill';
import React from 'react';
import { render } from 'react-dom';
import { Router, hashHistory } from 'react-router';
import routes from './routes';
import './app.global.css';

import { Provider } from 'mobx-react';

import map from './stores/map';


const stores = { map };

render(
  <Provider {...stores}>
    <Router history={hashHistory} routes={routes} />
  </Provider>,
  document.getElementById('root')
);
