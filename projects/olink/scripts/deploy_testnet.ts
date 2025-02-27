import { creator, factory } from './constants';

// Pass in some compilation flags
factory.send.create
  .createApplication({ args: [], sender: creator.addr })
  .then((res) => {
    console.log(res);
  })
  .catch((e) => {
    console.error(e);
  });
