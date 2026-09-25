import axios from 'axios';

const instance = axios.create({
  baseURL: 'https://backmern.picknow.in/',
  // baseURL: 'https://backmern.picknow.in/api',
  //   // Replace with your backend server URL
  headers: {
    'Content-Type': 'application/json'
  }
});

export default instance; 