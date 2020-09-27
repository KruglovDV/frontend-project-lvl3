import onChange from 'on-change';
import * as yup from 'yup';
import axios from 'axios';
import set from 'lodash/set';
import get from 'lodash/get';
import map from 'lodash/map';
import flatMap from 'lodash/flatMap';
import includes from 'lodash/includes';
import getFp from 'lodash/fp/get';
import uniqueId from 'lodash/uniqueId';
import filter from 'lodash/filter';
import zip from 'lodash/zip';
import differenceBy from 'lodash/differenceBy';
import i18next from 'i18next';

import watch from './watchers';
import FORM_STATES from './constants';
import parseFeed from './parser';

const TIMEOUT = 5000;

const PROXY_URL = 'https://cors-anywhere.herokuapp.com/';

const isUniqUrl = (urls, url) => () => {
  if (includes(urls, url)) {
    throw new Error(i18next.t('validationErrors.urlExists'));
  }
  return url;
};

const addIds = (posts, feedId) => (
  map(posts, (post) => ({ ...post, id: uniqueId(), feedId }))
);

const handleValidationError = (state) => (e) => {
  set(state, 'form', { state: FORM_STATES.ERROR, errorMessage: e.message });
};

const validate = (url, addedUrls) => (
  new Promise((resolve, reject) => (
    yup.string().url(i18next.t('validationErrors.invalidUrl'))
      .validate(url)
      .then(isUniqUrl(addedUrls, url))
      .then(resolve)
      .catch(reject)
  ))
);

const requestFeed = (url) => axios.get(`${PROXY_URL}${url}`).then(getFp('data'));

const setNewFeed = (state, url) => ({ feed, posts: newPosts }) => {
  const { feeds, posts } = state;
  const feedId = uniqueId();
  const newPostsWithFeedId = addIds(newPosts, feedId);
  set(state, 'feeds', [...feeds, { ...feed, id: feedId, url }]);
  set(state, 'posts', [...posts, ...newPostsWithFeedId]);
};

const startUpdateFeedsByTimeout = (state) => {
  setTimeout(async () => {
    const { feeds, posts } = state;
    const feedUrls = map(feeds, 'url');

    Promise.allSettled(map(feedUrls, requestFeed))
      .then((responses) => {
        const feedsResponses = zip(feeds, responses);
        const succeededResponses = filter(
          feedsResponses, ([, { status }]) => status !== 'rejected',
        );

        const newPosts = flatMap(succeededResponses, ([feed, response]) => {
          const { id: feedId } = feed;
          const { posts: newParsedPosts } = parseFeed(response.value);
          const addedPosts = differenceBy(newParsedPosts, posts, 'title');
          return addIds(addedPosts, feedId);
        });

        set(state, 'posts', [...posts, ...newPosts]);
        startUpdateFeedsByTimeout(state);
      })
      .catch(() => startUpdateFeedsByTimeout(state));
  }, TIMEOUT);
};

const app = () => {
  const state = {
    form: { state: FORM_STATES.FILLING },
    feeds: [],
    posts: [],
  };

  const watchedState = onChange(state, watch);
  startUpdateFeedsByTimeout(watchedState);

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
