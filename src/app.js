import _ from 'lodash';
import onChange from 'on-change';
import * as yup from 'yup';

import watch from './watchers';
import FORM_STATES from './constants';

const validateUrl = yup.string().url();

const processUrlValidationResult = (url, state) => (isUrlValid) => {
  const isUrlNotUniq = _.includes(_.map(state.feeds, 'url'), url);

  if (!isUrlValid || isUrlNotUniq) {
    const errorMessage = isUrlNotUniq ? 'url already exists' : 'invalid url';
    // eslint-disable-next-line no-param-reassign
    state.form = { state: FORM_STATES.ERROR, errorMessage };
    throw new Error(errorMessage);
  }

  // eslint-disable-next-line no-param-reassign
  state.form = { state: FORM_STATES.PROCESSED };
  return url;
};

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
    validateUrl.isValid(url)
      .then(processUrlValidationResult(url, watchedState))
      .catch(_.identity);
  };

  form.addEventListener('submit', formSubmitHandler);
};

export default app;
