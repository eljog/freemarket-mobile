import { IonApp, IonRouterOutlet, IonSplitPane } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { Redirect, Route } from 'react-router-dom';
import { Auth } from 'aws-amplify';
import { CognitoUser } from 'amazon-cognito-identity-js';
import { AuthState } from './reducers/authenication';
import { useDispatch, useSelector } from 'react-redux';
import { login } from './actions';
import Menu from './components/Menu';
import Page from './pages/Page';
import Login from './pages/Login';

/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

/* Theme variables */
import './theme/variables.css';
import { useEffect, useState } from 'react';
import { RootState } from './reducers';

const App: React.FC = () => {
  const authentication = useSelector<RootState, AuthState>((s) => s.authentication);
  const dispatch = useDispatch();

  // Restore login state
  useEffect(() => {
    if (authentication.isLoggedIn) {
      return;
    }

    Auth.currentSession().then(async (c) => {
      if (c.isValid()) {
        const maybeUser = await Auth.currentAuthenticatedUser();
        if (maybeUser) {
          const user = maybeUser as CognitoUser;

          const authState = {
            isLoggedIn: true,
            username: user.getUsername(),
            accessToken: c.getAccessToken().getJwtToken(),
            idToken: c.getIdToken().getJwtToken(),
            refreshToken: c.getRefreshToken().getToken(),
          } as AuthState;
          dispatch(login(authState));

          console.log('Restoring valid session');
        }
      }
      else {
        console.log('Session found but it is not valid. So not restoring')
      }
    }).catch(e => console.info('Cannot restore login: ', e));
  }, [authentication]);

  return (
    <IonApp>
      <IonReactRouter>
        <IonSplitPane contentId="main">
          <Menu />
          <IonRouterOutlet id="main">
            <Route path="/" exact={true}>
              <Redirect to="/page/Inbox" />
            </Route>
            <Route path="/Login" exact={true}>
              <Login />
            </Route>
            <Route path="/page/:name" exact={true}>
              <Page />
            </Route>
          </IonRouterOutlet>
        </IonSplitPane>
      </IonReactRouter>
    </IonApp>
  );
};

export default App;
