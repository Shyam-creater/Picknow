import axios from 'axios';

const instance = axios.create({ baseURL: 'https://backmern.picknow.in/api' });

export default instance;