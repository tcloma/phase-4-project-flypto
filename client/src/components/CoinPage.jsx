// Dependencies
import React, { useState } from 'react';
import { useQuery } from "react-query";
import { roundPrice } from '../utilFunctions'
import { useNavigate } from 'react-router-dom';
import { getCoin, getAllCoins, getCoinGraphData } from '../apis/coinApi';
import '../styles/CoinPage.scss'
import axios from 'axios'

// Fusion Charts
import FusionCharts from 'fusioncharts';
import FusionTheme from 'fusioncharts/themes/fusioncharts.theme.fusion';
import ReactFC from 'react-fusioncharts';
import Charts from 'fusioncharts/fusioncharts.charts';
import moment from 'moment';


ReactFC.fcRoot(FusionCharts, Charts, FusionTheme);

const CoinPage = ({ selectedCoin, user, setUser, purchasedCoins, setPurchasedCoins }) => {

   const [timePeriod, setTimePeriod] = useState('m1')
   const [transaction, setTransaction] = useState('buy')
   const [fromBTC, setFromBTC] = useState(true)
   const [cryptoAmount, setCryptoAmount] = useState(0)
   const [usdAmount, setUSDAmount] = useState(0)
   const [conversionCoin, setConversionCoin] = useState(false)
   const [conversionValue, setConversionValue] = useState(0)
   const [myFunds, setMyFunds] = useState(user.funds)

   const { isLoading: coinLoading, data: specCoinData } = useQuery('coinData', () => getCoin(selectedCoin));
   const { isLoading: graphLoading, data: graphData, refetch } = useQuery(timePeriod, () => getCoinGraphData(selectedCoin, timePeriod));
   const { data: allCoins } = useQuery('all-coins', () => getAllCoins())

   const navigate = useNavigate()

   const coinData = graphData

   const newData = coinData?.map((day) => {
      const newObj = {};
      let date;
      if (timePeriod === 'm1') {
         date = moment(day.date).format('h A');
      }
      if (timePeriod === 'h1') {
         date = moment(day.date).format('MMM DD');
      }
      if (timePeriod === 'd1') {
         date = moment(day.date).format('MMM DD, YYYY');
      }
      newObj['label'] = date
      newObj['value'] = day.priceUsd
      return newObj
   })

   const extraCoinInfoFormatter = (num) => {
      if (num >= 1000000000) {
         return (num / 1000000000).toFixed(1) + 'B';
      }
      if (num >= 1000000) {
         return (num / 1000000).toFixed(1) + 'M';
      }
      if (num >= 1000) {
         return (num / 1000).toFixed(1) + 'K';
      }
      return num;
   }

   const dataSource = {
      chart: {
         bgAlpha: "100",
         showBorder: 1,
         borderThickness: 1.5,
         caption: `${specCoinData?.name}`,
         plotFillColor: '#00dc00',
         outCnvBaseFontColor: '#252525',
         baseFont: 'Gilroy',
         drawFullAreaBorder: true,
         showPlotBorder: true,
         plotBorderThickness: 3,
         setAdaptiveYMin: true,
         labelStep: 100,
         plotBorderColor: '#00d400',
         bgColor: '#FFFFFF',
         subCaption: `(${specCoinData?.symbol})`,
         xAxisName: 'Day',
         yAxisName: 'Price ($USD)',
         numberPrefix: '$',
         theme: 'fusion'
      },
      annotations: {
         autoScale: '1',
         showBelow: '0',
         groups: [{
            id: 'price-displays',
            items: [{
               id: 'price-display',
               fillcolor: "#252525",
               fontsize: "26",
               type: "text",
               bold: 1,
               text: `$${roundPrice(specCoinData?.priceUsd)}`,
               x: "$canvasEndY-260",
               y: "$canvasEndY - 375",
            },
            {
               id: 'price-display',
               fillcolor: specCoinData?.changePercent24Hr > 0 ? "39FF14" : "#ff0000",
               fontsize: "12",
               italic: 1,
               type: "text",
               bold: 1,
               text: specCoinData?.changePercent24Hr > 0 ? `▲(${parseFloat(specCoinData?.changePercent24Hr).toFixed(2)}%)` : `▼(${parseFloat(specCoinData?.changePercent24Hr).toFixed(2)}%)`,
               x: "$canvasEndY-260",
               y: "$canvasEndY-355",
            }]

         }]

      },
      data: newData
   };

   const chartConfigs = {
      type: 'area2d',
      width: "900",
      height: "500",
      dataFormat: 'json',
      dataSource: dataSource
   };

   const selectTimePeriod = (e) => {
      setTimePeriod(e.target.value);
      refetch();
   }

   const selectConversionCoin = (e) => {
      setConversionCoin(JSON.parse(e.target.value))
   }

   const calculateConversionValue = (value) => {
      const selectedInUSD = specCoinData?.priceUsd * value
      const conversionCoinValue = selectedInUSD / conversionCoin.priceUsd
      setConversionValue(() => roundPrice(conversionCoinValue))
   }


   const handleChange = (e) => {
      if (transaction === 'buy' || transaction === 'sell') {
         if (fromBTC) {
            setCryptoAmount(parseFloat(e.target.value))
            handleConvertUSD(e.target.value)
         }
         else {
            setUSDAmount(e.target.value)
            handleConvertUSD(e.target.value)
         }
      }
      else {
         setCryptoAmount(parseFloat(e.target.value))
         calculateConversionValue(e.target.value)
      }

   }

   const handleConvertUSD = (value) => {
      if (fromBTC) {
         const convertedAmount = (value * specCoinData?.priceUsd)
         setUSDAmount(() => roundPrice(convertedAmount))
      }
      else {
         const convertedAmount = (value / specCoinData?.priceUsd)
         setCryptoAmount(() => roundPrice(convertedAmount))
      }
   }

   const handleSwap = (e) => {
      e.preventDefault()
      setFromBTC(!fromBTC)
   }

   const buyFundsData = {
      'funds': myFunds - parseFloat(usdAmount)
   }

   const sellFundsData = {
      'funds': parseFloat(myFunds) + parseFloat(usdAmount)
   }

   const postPurchaseData = {
      'name': specCoinData?.name,
      'symbol': specCoinData?.symbol,
      'quantity': cryptoAmount,
      'price': specCoinData?.priceUsd,
      'price_change': specCoinData?.changePercent24Hr,
      'user_id': user?.id
   }

   const findCoin = () => {
      return user.purchased_coins.find(coin => (coin.name === specCoinData?.name))
   }


   const handleBuySubmit = async (e) => {
      e.preventDefault()
      console.log('clicked')
      if (usdAmount < myFunds) {
         axios.patch('users', buyFundsData)
         setMyFunds(myFunds - parseFloat(usdAmount))
         let coin = findCoin()
         if (coin) {
            // let res1 = await axios.get(`/purchasedcoins/${coin.id}`)
            // let data1 = res1.data
            let intQuantity = parseFloat(coin.quantity)
            let intCrypto = parseFloat(cryptoAmount)
            const purchaseData = intQuantity += intCrypto
            console.log('purchaseData: ', purchaseData)
            const patchPurchaseData = {
               'quantity': purchaseData
            }
            console.log(patchPurchaseData)
            axios.patch(`purchasedcoins/${coin?.id}`, patchPurchaseData)
            const postPositionData = {
               "time_of_purchase": moment().toDate(),
               "price_of_purchase": usdAmount,
               "quantity_purchased": parseFloat(cryptoAmount),
               "purchased_coin_id": coin.id
            }
            let res2 = await axios.post(`/positionlists/`, postPositionData)
            let data2 = res2.data
            console.log(data2)
         }
         else {
            console.log('posted')
            axios.post(`/purchasedcoins/`, postPurchaseData)
            // setPurchasedCoins([...purchasedCoins, specCoinData?.name])
         }
         let res = await axios.get('/me');
         let data = res.data;
         console.log(data)
         console.log({ coin })
         setUser(data);
         findCoin()
         alert('Success!')
         setPurchasedCoins([...purchasedCoins, coin])
      }
      else {
         console.log('Not enough money')

      }
   }

   const handleSellSubmit = async (e) => {
      e.preventDefault()
      console.log('clicked')
      const coin = findCoin()
      if (coin && coin.quantity > 0) {
         axios.patch('users', sellFundsData)
         console.log('my funds:', myFunds)
         setMyFunds(myFunds + parseFloat(usdAmount))

         //   let res1 = await axios.get(`/purchasedcoins/${coin.id}`)
         //     let data = res1.data
         let intQuantity = parseFloat(coin.quantity)
         let intCrypto = parseFloat(cryptoAmount)
         const purchaseData = intQuantity -= intCrypto
         console.log('purchaseData: ', purchaseData)
         const patchPurchaseData = {
            'quantity': purchaseData
         }
         axios.patch(`purchasedcoins/${coin?.id}`, patchPurchaseData)
         const postPositionData = {
            "time_of_purchase": moment().toDate(),
            "price_of_purchase": -(usdAmount),
            "quantity_purchased": -(intCrypto),
            "purchased_coin_id": coin.id
         }
         axios.post(`/positionlists/`, postPositionData)
      }
      else {
         console.log('not enough')
      }
      console.log('new funds:', myFunds)
      let res = await axios.get('/me');
      let data = res.data;
      console.log('important data:', data)
      console.log(user)
      setUser(data);
      findCoin()
      alert('Success!')
   }


   const renderTrade = () => {
      if (transaction === 'buy') {
         return (
            <>
               <form onSubmit={(e) => handleBuySubmit(e)} id='buy-input-form'>
                  <div style={{ display: 'flex' }}>
                     <div>
                        <input onChange={(e) => handleChange(e)} type="text" id='amount-input-buy' name="amount" />
                        <h2>{fromBTC ? specCoinData?.symbol : 'USD'}</h2>
                     </div>
                     <div style={{ display: 'flex', minWidth: '50%', justifyContent: 'center', alignItems: 'center' }}>
                        <h2 id='result-amount'>{fromBTC ? `$${usdAmount}` : `${cryptoAmount} ${specCoinData.symbol}`}</h2>
                     </div>
                  </div>
                  <div style={{ display: 'flex' }}>
                     <button onClick={(e) => handleSwap(e)} id='swap-button'>{fromBTC ? `USD-${specCoinData?.symbol}` : `${specCoinData?.symbol}-USD`}</button>
                     <input className='buy-button' type="submit" value="Buy" />
                  </div>
               </form>
            </>
         )
      }
      if (transaction === 'sell') {
         return (
            <>
               <form onSubmit={(e) => handleSellSubmit(e)} id='buy-input-form'>
                  <input onChange={(e) => handleChange(e)} type="text" id='amount-input-buy' name="amount" />
                  <h2>{fromBTC ? specCoinData?.symbol : 'USD'}</h2>
                  <button onClick={(e) => handleSwap(e)} id='swap-button'>{fromBTC ? `USD-${specCoinData?.symbol}` : `${specCoinData?.symbol}-USD`}</button>
                  <input className='buy-button' type="submit" value="Sell" />
                  <h2 id='result-amount'>{fromBTC ? `$${usdAmount}` : `${cryptoAmount} ${specCoinData.symbol}`}</h2>
               </form>
            </>
         )
      }
      if (transaction === 'convert')
         return (
            <>
               <form onSubmit={(e) => handleBuySubmit(e)} id='buy-input-form'>
                  <input onChange={(e) => handleChange(e)} type="text" id='amount-input-buy' name="amount" />
                  <h2>{specCoinData?.symbol}</h2>
                  {/* <button onClick={(e) => handleSwap(e)} id='swap-button'>{fromBTC ? `USD-${specCoinData?.symbol}`: `${specCoinData?.symbol}-USD`}</button> */}
                  <input className='buy-button' type="submit" value="Convert" />
                  <select onChange={(e) => selectConversionCoin(e)} name="conversion-choice" id="conversion-choice">
                     {allCoins.map((coin) => {
                        return (
                           <option value={JSON.stringify(coin)}>{coin.symbol}</option>
                        )
                     })}
                  </select>
                  <h2 id='result-amount'>{`${conversionValue} ${conversionCoin ? conversionCoin.symbol : ''}`}</h2>
               </form>
            </>
         )
   }
   console.log(selectedCoin)
   if (selectedCoin === '') return <div style={{ height: '100vh', backgroundColor: '#222630', marginBottom: '-7vh', display: 'grid', placeContent: 'center' }}> <h1 style={{ color: '#FFFFFF' }} > Select a coin from <span style={{ color: '#58f582', textDecoration: 'underline', cursor: 'pointer' }} onClick={() => navigate('/crypto')}>Crypto Page</span> to display data! </h1></div>
   return (
      <div className='full-page-container'>
         <div className='coin-chart-container'>
            <div className='coin-chart'>
               {graphLoading ? <p>Loading ...</p> : <ReactFC {...chartConfigs} />}
               <div className='time-choices'>

                  <select onChange={selectTimePeriod} name="time-period" id="time-period">
                     <option value="m1">Today</option>
                     <option value="h1">This Month</option>
                     <option value="d1">This Year</option>
                  </select>
                  <div className='coin-extra-info'>
                     <div className='coin-extra-info-container'>
                        <div className='coin-extra-info-element'>
                           <h4>Market Cap</h4>
                           <p>{`$${extraCoinInfoFormatter(specCoinData?.marketCapUsd)}`}</p>
                        </div>
                        <div className='coin-extra-info-element'>
                           <h4>Volume (24hr)</h4>
                           <p>{`$${extraCoinInfoFormatter(specCoinData?.volumeUsd24Hr)}`}</p>
                        </div >
                        <div className='coin-extra-info-element'>
                           <h4>Supply</h4>
                           <p>{`${extraCoinInfoFormatter(specCoinData?.supply)} ${specCoinData?.symbol}`}</p>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
            <div className='buy-sell-container'>
               <div className='info-container'>
                  <h2>Trade</h2>
               </div>
               <h4 className='amount-owned'>{`${findCoin() ? findCoin().quantity : 0} ${specCoinData?.symbol} ($${parseFloat(findCoin() ? findCoin().quantity * specCoinData?.priceUsd : 0).toFixed(2)})`}</h4>
               <div className='info-button-container'>
                  <button onClick={() => { setConversionCoin(false); setTransaction('buy') }} className='info-buttons'>Buy</button>
                  <button onClick={() => { setConversionCoin(false); setTransaction('sell') }} className='info-buttons'>Sell</button>
                  <button onClick={() => { setConversionCoin(false); setTransaction('convert') }} className='info-buttons'>Convert</button>
               </div>
               <div className='trade-component'>
                  {renderTrade()}
               </div>
            </div>
         </div>
      </div>
   )
}

export default CoinPage