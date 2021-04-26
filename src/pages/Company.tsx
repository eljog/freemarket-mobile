import { IonAvatar, IonBackButton, IonButton, IonButtons, IonCol, IonContent, IonHeader, IonInput, IonItem, IonLabel, IonList, IonListHeader, IonModal, IonNote, IonPage, IonRow, IonSelect, IonSelectOption, IonSpinner, IonText, IonTitle, IonToast, IonToolbar } from '@ionic/react';
import { arrowBack } from 'ionicons/icons';
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory, useParams } from 'react-router';
import { updatePortfolioStock } from '../actions';
import { CompanyProfile, InvestType, Portfolio, ResponseError, StockTradeRequest, TransactionType } from '../models';
import { RootState } from '../reducers';
import { AuthState } from '../reducers/authenication';
import { apiService } from '../services/ApiService';
import './Company.scss';

interface Toast {
  title?: string;
  body?: string;
  isError?: boolean;
}

const Company: React.FC = () => {
  const { symbol } = useParams<{ symbol: string; }>();

  const [companyProfile, setCompanyProfile] = useState<CompanyProfile>();
  const [showBuySell, setShowBuySell] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [quantityError, setQuantityError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<Toast | null>();

  const [investType, setInvestType] = useState(InvestType.Dollars);
  const [transactionType, setTransactionType] = useState(TransactionType.Buy);
  const [quantity, setQuantity] = useState<number>(0);

  const authentication = useSelector<RootState, AuthState>((s) => s.authentication);
  const portfolio = useSelector<RootState, Portfolio>((s) => s.portfolio);
  const dispatch = useDispatch();

  const history = useHistory();

  useEffect(() => {
    if (!authentication.isLoggedIn) {
      history.push('/login');
      return;
    }

    async function fetchCompanyProfile() {
      const company = await apiService.fetchCompanyProfile(symbol);
      setCompanyProfile(company);
    };

    fetchCompanyProfile();
  }, [authentication, symbol]);

  const estimateTrade = () => {
    const price = companyProfile?.priceInfo.price;
    if (quantity && price) {
      if (investType == InvestType.Shares) {
        return (quantity * price).toFixed(5);
      }
      else {
        return (quantity / price).toFixed(5);
      }
    }

    return 0.0;
  };

  const handleTrade: React.FormEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault();
    event.stopPropagation();
    const form = event.currentTarget;

    setFormSubmitted(true);
    if (!form.checkValidity() || !companyProfile) {
      return;
    }

    if (!quantity || quantity < 0.1) {
      setQuantityError(true);
      return;
    }

    try {
      setSubmitting(true);

      var stockTradeRequest = {
        investType: investType,
        quantity: quantity,
      } as StockTradeRequest;
      var result = await apiService.tradeStock(companyProfile.symbol, stockTradeRequest, transactionType);

      dispatch(updatePortfolioStock(result.stock));

      console.log("Trade Result", result);

      const action = result.transaction.transactionType === TransactionType.Buy ? 'Purchased' : 'Sold';
      setToastMessage({ title: `${action} ${result.transaction.symbol} for $${(result.transaction.price * result.transaction.shares).toFixed(3)}`, body: `Successfully ${action.toLowerCase()} ${result.transaction.shares.toFixed(3)} shares of ${result.transaction.symbol} at an average cost of ${result.transaction.price.toFixed(3)}.` })
    } catch (error) {
      let errorMessage = 'Unable to trade the stock at the moment. Please try again later.';
      if (error instanceof ResponseError) {
        errorMessage = error.message;
      }

      setToastMessage({ title: 'Transaction failed', body: errorMessage, isError: true })

      console.error('error when buying:', error);
    } finally {
      setSubmitting(false);
      setShowBuySell(false);
      setQuantity(0);
      setQuantityError(false);
    }
  }


  const currencyFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  });

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton icon={arrowBack} />
          </IonButtons>
          {symbol}
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <IonHeader collapse="condense">
          <IonToolbar>
            <IonButtons slot="start">
              <IonBackButton icon={arrowBack} />
            </IonButtons>
            {symbol}
          </IonToolbar>
        </IonHeader>

        <IonToast
          isOpen={!!toastMessage}
          onDidDismiss={() => setToastMessage(null)}
          message={toastMessage?.body}
          duration={3000}
        />

        <IonList id="inbox-list">
          <IonRow>
            <IonCol>
              <IonItem>
                <IonAvatar slot="start">
                  <img src={`https://storage.googleapis.com/iex/api/logos/${symbol}.png`} width="32"
                    height="32" />
                </IonAvatar>
                <IonLabel>{companyProfile?.companyName}</IonLabel>
                <IonNote slot="end" color="primary">${companyProfile?.priceInfo.price}</IonNote>
              </IonItem>
            </IonCol>
          </IonRow>

          <IonRow className="ion-text-center">
            <IonCol>
              {companyProfile &&
                <IonRow>
                  <IonCol className="text-center">
                    <IonButton className="mr-1" onClick={() => { setShowBuySell(true); setTransactionType(TransactionType.Buy); }}>{TransactionType.Buy}</IonButton>
                    <IonButton className="mr-1" onClick={() => { setShowBuySell(true); setTransactionType(TransactionType.Sell); }}>{TransactionType.Sell}</IonButton>
                    <IonModal isOpen={showBuySell} onDidDismiss={() => setShowBuySell(false)} >
                      <IonHeader>
                        <IonToolbar>
                          <IonTitle>{transactionType} {companyProfile?.symbol}</IonTitle>
                        </IonToolbar>
                      </IonHeader>
                      <IonContent>
                        <form noValidate onSubmit={handleTrade}>
                          <IonList>
                            <IonItem>
                              <IonLabel position="stacked" color="primary">Invest In</IonLabel>
                              <IonSelect value={investType} placeholder="Select One" onIonChange={(e) => { setInvestType(e.detail.value as InvestType) }}>
                                <IonSelectOption value={InvestType.Dollars}>{InvestType.Dollars}</IonSelectOption>
                                <IonSelectOption value={InvestType.Shares}>{InvestType.Shares}</IonSelectOption>
                              </IonSelect>

                            </IonItem>

                            <IonItem>
                              <IonLabel position="stacked" color="primary">{investType === InvestType.Shares ? "Shares" : "Amount"}</IonLabel>
                              <IonInput name="quantity" type="number" value={quantity} onIonChange={(e) => setQuantity(parseFloat(e.detail.value!))} required />
                              {formSubmitted && quantityError && <IonText color="danger">
                                <p className="ion-padding-start">
                                  Entered quantity is not valid.
                                </p>
                              </IonText>}
                            </IonItem>
                            <IonItem>
                              <IonLabel position="stacked" color="primary">Estimated {investType === InvestType.Dollars ? "shares" : "price"}</IonLabel>
                              <IonLabel>
                                {estimateTrade()}
                              </IonLabel>
                            </IonItem>
                            <hr />
                            <IonRow>
                              {!submitting && <IonCol>
                                <IonButton onClick={() => setShowBuySell(false)}>
                                  Cancel
                                </IonButton>
                              </IonCol>
                              }
                              <IonCol>
                                <IonButton expand="block" type="submit">
                                  {submitting ?
                                    <IonSpinner name="dots" />
                                    :
                                    <span>{transactionType}</span>
                                  }
                                </IonButton>
                              </IonCol>
                            </IonRow>
                          </IonList>
                        </form>
                      </IonContent>
                    </IonModal>
                  </IonCol>
                </IonRow>
              }
            </IonCol>
          </IonRow>
          <IonListHeader>Price Info</IonListHeader>
          <IonRow className="regular-content">
            <IonCol>
              <IonNote>High&nbsp;Today</IonNote><br />
              <IonLabel>${companyProfile?.priceInfo.high}</IonLabel>
              <hr />
              <IonNote>52&nbsp;Weeks&nbsp;High</IonNote><br />
              <IonLabel>${companyProfile?.priceInfo.week52High}</IonLabel>
              <hr />
              <IonNote>Open</IonNote><br />
              <IonLabel>${companyProfile?.priceInfo.open}</IonLabel>
              <hr />
            </IonCol>
            <IonCol>
              <IonNote>Low&nbsp;Today</IonNote><br />
              <IonLabel>${companyProfile?.priceInfo.low}</IonLabel>
              <hr />
              <IonNote>52&nbsp;Weeks&nbsp;Low</IonNote><br />
              <IonLabel>${companyProfile?.priceInfo.week52Low}</IonLabel>
              <hr />
              <IonNote>Close</IonNote><br />
              <IonLabel>${companyProfile?.priceInfo.close}</IonLabel>
              <hr />
            </IonCol>
          </IonRow>

          {companyProfile?.symbol && portfolio.stocks.find(s => s.symbol === companyProfile.symbol) &&
            <div>
              <IonListHeader>Your Investment</IonListHeader>
              {portfolio.stocks.filter(s => s.symbol === companyProfile.symbol).map(stock => {
                const equity = stock.price * stock.shares;
                const yourReturn = equity - stock.averageCost * stock.shares;
                return (
                  <IonRow className="subtitle-content">
                    <IonCol>
                      <IonNote>Shares</IonNote><br />
                      <IonLabel>{stock.shares.toFixed(3)}</IonLabel>
                      <hr />
                      <IonNote>Last&nbsp;Price</IonNote><br />
                      <IonLabel>{currencyFormatter.format(stock.price)}</IonLabel>
                      <hr />
                    </IonCol>
                    <IonCol>
                      <IonNote>Your&nbsp;Equity</IonNote><br />
                      <IonLabel>{currencyFormatter.format(equity)}</IonLabel>
                      <hr />
                      <IonNote>Your&nbsp;Return</IonNote><br />
                      <IonLabel>{currencyFormatter.format(yourReturn)}</IonLabel>
                      <hr />

                    </IonCol>
                  </IonRow>)
              })
              }
            </div>
          }

          <IonListHeader>Company Info</IonListHeader>
          <IonRow className="regular-content">
            <IonCol>
              <IonNote>CEO</IonNote><br />
              <IonLabel>{companyProfile?.ceo}</IonLabel>
              <hr />
              {companyProfile?.employees ?
                <div>
                  <IonNote>Employees</IonNote><br />
                  <IonLabel>{companyProfile?.employees}</IonLabel>
                  <hr />
                </div>
                :
                <div>
                  <IonNote>Exchange</IonNote><br />
                  <IonLabel>{companyProfile?.exchange}</IonLabel>
                  <hr />
                </div>
              }
            </IonCol>
            <IonCol>
              <IonNote>Symbol</IonNote><br />
              <IonLabel>{companyProfile?.symbol}</IonLabel>
              <hr />
              <IonNote>Industry</IonNote><br />
              <IonLabel>{companyProfile?.industry}</IonLabel>
              <hr />
            </IonCol>
          </IonRow>
        </IonList>
      </IonContent>
    </IonPage>
  );
};

export default Company;
