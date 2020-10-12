import get from 'lodash/get';
import map from 'lodash/map';

const parseNode = (node) => {
  const titleNode = node.querySelector('title');
  const descriptionNode = node.querySelector('description');
  const linkNode = node.querySelector('link');

  return {
    title: get(titleNode, 'textContent', ''),
    description: get(descriptionNode, 'textContent', ''),
    link: get(linkNode, 'textContent', ''),
  };
};

const parseFeed = (text) => {
  // eslint-disable-next-line no-undef
  const doc = new DOMParser().parseFromString(text, 'text/xml');

  const channelNode = doc.querySelector('channel');
  const postNodes = doc.querySelectorAll('item');

  const feed = parseNode(channelNode);
  const posts = map(postNodes, parseNode);

  return { feed, posts };
};

export default parseFeed;
