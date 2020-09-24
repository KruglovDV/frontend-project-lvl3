import _ from 'lodash';
import onChange from 'on-change';
import * as yup from 'yup';

import watch from './watchers';
import FORM_STATES from './constants';

const isValidUrl = yup.string().url();

const isUniqUrl = (urls, url) => () => {
  if (_.includes(urls, url)) {
    throw new Error('url is already exists');
  };
  return url;
};

const handleValidationError = (state) => (e) => {
  state.form = { state: FORM_STATES.ERROR, errorMessage: e.message };
}

const validate = (url, addedUrls) => new Promise((resolve, reject) => {
  return isValidUrl.validate(url)
    .then(isUniqUrl(addedUrls, url))
    .then(resolve)
    .catch(reject);
});

const app = () => {
  const state = {
    form: {
      state: FORM_STATES.FILLING,
    },
    feeds: [{ id: 1, url: 'https://ru.hexlet.io/lessons.rss' }], // { id, url }
    posts: [], // { id, url, feedId }
  };

  const watchedState = onChange(state, watch);

  const form = document.getElementById('rssForm'); // eslint-disable-line no-undef

  const formSubmitHandler = (event) => {
    event.preventDefault();
    const url = _.get(event, 'target.url.value');
    const addedUrls = _.map(state.feeds, 'url');

    validate(url, addedUrls)
    .then((url) => {
      watchedState.form = { state: FORM_STATES.PROCESSED };
    })
    .catch(handleValidationError(watchedState));
  };

  form.addEventListener('submit', formSubmitHandler);
};

export default app;
