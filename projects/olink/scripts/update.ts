import { appClient, creator } from './constants';

appClient.send.update.updateApplication({
  args: [],
  sender: creator.addr,
});
