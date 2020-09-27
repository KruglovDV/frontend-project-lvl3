import 'bootstrap';

import i18next from 'i18next';

import './app.scss';
import app from './app';
import en from './dictionaries/en';

i18next.init({
  lng: 'en',
  resources: {
    en: {
      translation: en,
    }
  }
}).then(app);

