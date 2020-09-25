import _ from 'lodash';
import _fp from 'lodash/fp';
import onChange from 'on-change';
import * as yup from 'yup';
import axios from 'axios';

import watch from './watchers';
import FORM_STATES from './constants';
import parseFeed from './parser';

const isValidUrl = yup.string().url();

const isUniqUrl = (urls, url) => () => {
  if (_.includes(urls, url)) {
    throw new Error('url is already exists');
  }
  return url;
};

const handleValidationError = (state) => (e) => {
  _.set(state, 'form', { state: FORM_STATES.ERROR, errorMessage: e.message });
};

const validate = (url, addedUrls) => (
  new Promise((resolve, reject) => (
    isValidUrl.validate(url)
      .then(isUniqUrl(addedUrls, url))
      .then(resolve)
      .catch(reject)
  ))
);

const requestFeed = (url) => axios.get(url).then(_fp.get('data'));

const setNewFeed = (state) => ({ feed, posts: newPosts }) => {
  const { feeds, posts } = state;
  _.set(state, 'feeds', [...feeds, feed]);
  _.set(state, 'posts', [...posts, ...newPosts]);
};

const app = () => {
  const state = {
    form: { state: FORM_STATES.FILLING },
    feeds: [{ id: 1, url: 'https://ru.hexlet.io/lessonss.rss' }], // { id, url }
    posts: [], // { id, url, feedId }
  };

  const watchedState = onChange(state, watch);

  const form = document.getElementById('rssForm'); // eslint-disable-line no-undef

  const formSubmitHandler = (event) => {
    event.preventDefault();
    const url = _.get(event, 'target.url.value');
    const addedUrls = _.map(state.feeds, 'url');

    validate(url, addedUrls)
      .then(() => {
        _.set(watchedState, 'form', { state: FORM_STATES.PROCESSED });
        return requestFeed(url);
      })
      .then(parseFeed)
      .then(setNewFeed(watchedState))
      .catch(handleValidationError(watchedState));
  };

  form.addEventListener('submit', formSubmitHandler);
};

export default app;
