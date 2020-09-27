import onChange from 'on-change';
import * as yup from 'yup';
import axios from 'axios';
import set from 'lodash/set';
import get from 'lodash/get';
import map from 'lodash/map';
import includes from 'lodash/includes';
import getFp from 'lodash/fp/get';
import i18next from 'i18next';

import watch from './watchers';
import FORM_STATES from './constants';
import parseFeed from './parser';

const proxyUrl = 'https://cors-anywhere.herokuapp.com/';

const isUniqUrl = (urls, url) => () => {
  if (includes(urls, url)) {
    throw new Error(i18next.t('validationErros.urlExists'));
  }
  return url;
};

const handleValidationError = (state) => (e) => {
  set(state, 'form', { state: FORM_STATES.ERROR, errorMessage: e.message });
};

const validate = (url, addedUrls) => (
  new Promise((resolve, reject) => (
    yup.string().url(i18next.t('validationErros.invalidUrl'))
      .validate(url)
      .then(isUniqUrl(addedUrls, url))
      .then(resolve)
      .catch(reject)
  ))
);

const requestFeed = (url) => axios.get(`${proxyUrl}${url}`).then(getFp('data'));

const setNewFeed = (state, url) => ({ feed, posts: newPosts }) => {
  const { feeds, posts } = state;
  set(state, 'feeds', [...feeds, { ...feed, url }]);
  set(state, 'posts', [...posts, ...newPosts]);
};

const app = () => {
  const state = {
    form: { state: FORM_STATES.FILLING },
    feeds: [],
    posts: [],
  };

  const watchedState = onChange(state, watch);

  const form = document.getElementById('rssForm');

  const formSubmitHandler = (event) => {
    event.preventDefault();
    const url = get(event, 'target.url.value');
    const addedUrls = map(state.feeds, 'url');

    validate(url, addedUrls)
      .then(() => {
        set(watchedState, 'form', { state: FORM_STATES.REQUEST });
        return requestFeed(url);
      })
      .then((fetchedFeed) => {
        set(watchedState, 'form', { state: FORM_STATES.PROCESSED });
        return parseFeed(fetchedFeed);
      })
      .then(setNewFeed(watchedState, url))
      .catch(handleValidationError(watchedState));
  };

  form.addEventListener('submit', formSubmitHandler);
};

export default app;
