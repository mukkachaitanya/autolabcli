const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const nock = require('nock');

chai.use(sinonChai);
chai.should();

const preferenceManager = require('../../../../lib/utils/preference-manager');
const initModel = require('../../../../lib/model/init');
const { logger } = require('../../../../lib/utils/logger');

let host = 'autolab.bits-goa.ac.in';
if (preferenceManager.getPreference({ name: 'cliPrefs' }).gitlab) {
  ({ host } = preferenceManager.getPreference({ name: 'cliPrefs' }).gitlab);
}

chai.use(chaiAsPromised);
chai.should();

describe('for initModel', () => {
  const sandbox = sinon.createSandbox();

  afterEach(() => {
    sandbox.restore();
  });

  it('should return status code 200 after successful login', async () => {
    const mocklogger = sandbox.stub(logger, 'log');
    const fakeServer = nock(`https://${host}`)
      .post('/api/v4/session?login=testuser3&password=123');

    const httpOK = 200;

    fakeServer.reply(httpOK, {
      ok: true,
      name: 'test_user3',
      private_token: 'zxcvbnb',
    });
    const status = await initModel.authenticate({
      username: 'testuser3',
      password: '123',
    });
    status.code.should.equal(httpOK);
    status.name.should.equal('test_user3');
    preferenceManager.getPreference({ name: 'gitLabPrefs' }).privateToken.should.equal('zxcvbnb');
    mocklogger.called.should.equal(true);
  });

  it('should return status code of 401 when invalid login provided', async () => {
    const mocklogger = sandbox.stub(logger, 'log');
    const fakeServer = nock(`https://${host}`)
      .post('/api/v4/session?login=testuser&password=123');

    const httpUnauth = 401;
    fakeServer.reply(httpUnauth);
    const status = await initModel.authenticate({
      username: 'testuser',
      password: '123',
    });
    status.code.should.equal(httpUnauth);
    mocklogger.called.should.equal(true);
  });

  it('should return code 4 if unkown error occurs', async () => {
    const mocklogger = sandbox.stub(logger, 'log');
    const httpFailure = 4;
    const status = await initModel.authenticate({
      username: 'testuser',
      password: '123',
    });
    status.code.should.equal(httpFailure);
    mocklogger.called.should.equal(true);
  });
});
