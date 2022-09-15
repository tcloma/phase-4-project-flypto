import { Routes, Route, BrowserRouter } from 'react-router-dom';
import React from "react";
import { useState } from "react";
import Homepage from './Homepage';
import Layout from './Layout';
import CoinPage from './CoinPage.jsx'
import '../styles/App.scss';
import { QueryClient, QueryClientProvider } from 'react-query'
import { ReactQueryDevtools } from 'react-query/devtools'
import LoginPage from './LoginPage';
import SignupPage from './SignupPage';
import ProfilePage from './ProfilePage';
import CryptoPage from './CryptoPage';
import { useEffect } from 'react';
// import axios from 'axios'
import Header from './sub-components/Header';

const queryClient = new QueryClient();


const App = () => {
  const [purchasedCoins, setPurchasedCoins] = ([])
  const [selectedCoin, setSelectedCoin] = useState('')
  const [user, setUser] = useState(null)

  // console.log('User: ',user)

useEffect(() => {
  fetch('/me').then((res) => {
    if (res.ok) {
      res.json().then((user) => setUser(user))
    }
  })
  fetch('/purchasedcoins')
  .then((res) => {
    if(res.ok) {
      res.json()
      .then((purchasedCoins) => setPurchasedCoins(purchasedCoins))
    }
  })
}, []);

    const handleLogoutClick = () =>  {
    fetch("/logout", { method: "DELETE" }).then((r) => {
      if (r.ok) {
        setUser(null)
        // console.log(user)
      }
    });
  }


// if (!user) return <LoginPage setUser={setUser} />
// if (user) return <ProfilePage setUser={setUser} />

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Layout user={user}>
          <Routes>
            <Route path='/' element={<Homepage setSelectedCoin={setSelectedCoin} />} />
            <Route path='/trade' element={<CoinPage selectedCoin={selectedCoin} />} />
            <Route path='/logout'/>
            <Route path='/crypto' element={<CryptoPage />} />
            <Route path='/profile' element={<ProfilePage username={user?.name}/>} />
            <Route path='/login' element={<LoginPage onLogin={setUser} />} />
            <Route path='/signup' element={<SignupPage />} />
          </Routes>
          <ReactQueryDevtools />
        </Layout>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
