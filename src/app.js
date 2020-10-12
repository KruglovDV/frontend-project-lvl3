import onChange from 'on-change';
import * as yup from 'yup';
import axios from 'axios';
import get from 'lodash/get';
import map from 'lodash/map';
import flatMap from 'lodash/flatMap';
import getFp from 'lodash/fp/get';
import uniqueId from 'lodash/uniqueId';
import filter from 'lodash/filter';
import zip from 'lodash/zip';
import differenceBy from 'lodash/differenceBy';
import i18next from 'i18next';

import watch from './watchers';
import FORM_STATES from './constants';
import parseFeed from './parser';
import en from './dictionaries/en';

const TIMEOUT = 5000;

const PROXY_URL = 'https://cors-anywhere.herokuapp.com/';

const validate = (feedUrl, addedFeedsUrls) => {
  yup.string().url().validateSync(feedUrl);
  yup.mixed().notOneOf(addedFeedsUrls).validateSync(feedUrl);
};

const addIds = (posts, feedId) => (
  map(posts, (post) => ({ ...post, id: uniqueId(), feedId }))
);

const handleValidationError = (e, state) => {
  // eslint-disable-next-line no-param-reassign
  state.form = { state: FORM_STATES.ERROR, errorMessage: e.message };
};

const requestFeed = (url) => axios.get(`${PROXY_URL}${url}`).then(getFp('data'));

const setNewFeed = (state, url) => ({ feed: newFeed, posts: newPosts }) => {
  const { feeds: addedFeeds, posts } = state;
  const feedId = uniqueId();
  const newPostsWithFeedId = addIds(newPosts, feedId);

  // eslint-disable-next-line no-param-reassign
  state.feeds = [...addedFeeds, { ...newFeed, id: feedId, url }];
  // eslint-disable-next-line no-param-reassign
  state.posts = [...posts, ...newPostsWithFeedId];
};

const startUpdateFeedsByTimeout = (state) => {
  setTimeout(async () => {
    const { feeds, posts } = state;
    const feedUrls = map(feeds, 'url');

    Promise.allSettled(map(feedUrls, requestFeed))
      .then((responses) => {
        const feedResponsePairs = zip(feeds, responses);
        const succeededFeedResponsePairs = filter(
          feedResponsePairs, ([, { status }]) => status !== 'rejected',
        );

        const newPosts = flatMap(succeededFeedResponsePairs, ([feed, response]) => {
          const { id: feedId } = feed;
          const { posts: newParsedPosts } = parseFeed(response.value);
          const addedPosts = differenceBy(newParsedPosts, posts, 'title');
          return addIds(addedPosts, feedId);
        });

        // eslint-disable-next-line no-param-reassign
        state.posts = [...posts, ...newPosts];
      })
      .finally(() => startUpdateFeedsByTimeout(state));
  }, TIMEOUT);
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
    const feedUrl = get(event, 'target.url.value');
    const addedFeedsUrls = map(state.feeds, 'url');

    try {
      validate(feedUrl, addedFeedsUrls);
      watchedState.form = { state: FORM_STATES.REQUEST };
      requestFeed(feedUrl)
        .then((requestedFeed) => {
          watchedState.form = { state: FORM_STATES.PROCESSED };
          return parseFeed(requestedFeed);
        })
        .then(setNewFeed(watchedState, feedUrl))
        .catch((e) => handleValidationError(e, watchedState));
    } catch (e) {
      handleValidationError(e, watchedState);
    }
  };

  form.addEventListener('submit', formSubmitHandler);

  return i18next.init({
    lng: 'en',
    resources: {
      en: {
        translation: en,
      },
    },
  }).then(() => {
    yup.setLocale({
      string: { url: i18next.t('validationErrors.invalidUrl') },
      mixed: { notOneOf: i18next.t('validationErrors.urlExists') },
    });
    startUpdateFeedsByTimeout(watchedState);
  });
};

export default app;
