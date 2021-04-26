import { Plugins } from '@capacitor/core';
import { IonButton, IonButtons, IonCol, IonContent, IonHeader, IonInput, IonItem, IonLabel, IonList, IonMenuButton, IonPage, IonRow, IonSpinner, IonText, IonTitle, IonToolbar, useIonAlert } from '@ionic/react';
import { CognitoUser } from 'amazon-cognito-identity-js';
import { Auth } from 'aws-amplify';
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router';
import { login } from '../actions';
import { RootState } from '../reducers';
import { AuthState } from '../reducers/authenication';
import './Login.scss';

const Login: React.FC = () => {
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [formSubmitted, setFormSubmitted] = useState(false);
    const [usernameError, setUsernameError] = useState(false);
    const [passwordError, setPasswordError] = useState(false);
    const [signingIn, setSigningIn] = useState<boolean>();

    const [present] = useIonAlert();
    const history = useHistory();
    const dispatch = useDispatch();
    const authentication = useSelector<RootState, AuthState>((s) => s.authentication);

    useEffect(() => {
        if (authentication.isLoggedIn) {
            history.push('/', { direction: 'none' });
        }
    }, [authentication]);

    const { Browser } = Plugins;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormSubmitted(true);
        setErrorMessage('');

        if (!username) {
            setUsernameError(true);
            return;
        }
        else {
            setUsernameError(false);
        }
        if (!password) {
            setPasswordError(true);
            return;
        }
        else {
            setPasswordError(false);
        }

        setSigningIn(true);
        try {
            const user = await Auth.signIn(username, password) as CognitoUser;
            const uname = user.getUsername();
            const authState = {
                isLoggedIn: true,
                username: uname
            } as AuthState;

            const session = await Auth.currentSession();
            authState.accessToken = session.getAccessToken().getJwtToken();
            authState.idToken = session.getIdToken().getJwtToken();
            authState.refreshToken = session.getRefreshToken().getToken();

            dispatch(login(authState));
        } catch (error) {
            console.log(error);
            setErrorMessage(error.message);
        }
        finally {
            setSigningIn(false);
            setFormSubmitted(false);
        }
    };

    return (
        <IonPage id="login-page">
            <IonHeader>
                <IonToolbar>
                    <IonButtons slot="start">
                        <IonMenuButton></IonMenuButton>
                    </IonButtons>
                    <IonTitle>Welcome to FreeMarket</IonTitle>
                </IonToolbar>
            </IonHeader>
            <IonContent>

                <div className="login-logo">
                    <img src="assets/logo.png" alt="Freemarket logo" />
                </div>

                <form noValidate onSubmit={handleSubmit}>
                    <IonList>
                        <IonItem>
                            <IonLabel position="stacked" color="primary">Username</IonLabel>
                            <IonInput name="username" type="text" value={username} spellCheck={false} autocapitalize="off" onIonChange={e => setUsername(e.detail.value!)}
                                required>
                            </IonInput>
                        </IonItem>

                        {formSubmitted && usernameError && <IonText color="danger">
                            <p className="ion-padding-start">
                                Username is required
                            </p>
                        </IonText>}

                        <IonItem>
                            <IonLabel position="stacked" color="primary">Password</IonLabel>
                            <IonInput name="password" type="password" value={password} onIonChange={e => setPassword(e.detail.value!)}>
                            </IonInput>
                        </IonItem>

                        {formSubmitted && passwordError && <IonText color="danger">
                            <p className="ion-padding-start">
                                Password is required
                            </p>
                        </IonText>}
                    </IonList>

                    <IonRow>
                        <IonCol>
                            <IonButton type="submit" expand="block">{formSubmitted && signingIn ? <span><IonSpinner name="dots" /></span> : <span>Login</span>}</IonButton>
                        </IonCol>
                        <IonCol>
                            <IonButton color="light" expand="block" onClick={() =>
                                present({
                                    header: 'Signup on the web app',
                                    message: 'Please visit our website to complete signup.',
                                    buttons: [
                                        'Cancel',
                                        { text: 'Signup on the Web App', handler: (d) => Browser.open({ url: 'https://freemarket.azurewebsites.net/signup' }) },
                                    ],
                                    onDidDismiss: (e) => console.log('did dismiss'),
                                })
                            }>Signup</IonButton>
                        </IonCol>
                    </IonRow>
                    <IonRow>
                        {errorMessage && <IonText color="danger">
                            <p className="ion-padding-start">
                                {errorMessage}
                            </p>
                        </IonText>}
                    </IonRow>
                </form>

            </IonContent>

        </IonPage>
    );
};

export default Login;
