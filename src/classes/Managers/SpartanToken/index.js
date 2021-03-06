import SpartanTokenRetriever from 'cryptum-spartantoken-retriever'
import _ from '@modules/helpers/lodash'

class SpartanTokenManager
{
    /**
     * SpartanTokenManager constructor
     */
    constructor() {
        this.email = null;
        this.password = null;
        this.autoRenew = false;
        this.spartanToken = null;
    }

    /**
     * Get email
     * @return {string} email
     */
    getEmail = () => this.email

    /**
     * Get password
     * @return {string} email
     */
    getPassword = () => this.password

    /**
     * Get spartan token
     * @return {Object} spartanToken
     */
    getSpartanToken = () => this.spartanToken

    /**
     * Set email
     * @param {string} email
     * @return {Object} this
     */
    setEmail = email => {
        this.email = email;
        return this;
    }

    /**
     * Set password
     * @param {string} password
     * @return {Object} this
     */
    setPassword = password => {
        this.password = password;
        return this;
    }

    /**
     * Set auto-renew status
     * @param {boolean} status
     * @returns {Object} this
     */
    setAutoRenewStatus = (status = true) => {
        this.autoRenew = Boolean(status);
        return this;
    }

    /**
     * Set spartan token
     * @param {Object|string} spartanToken
     * @return {Object} this
     */
    setSpartanToken = spartanToken => {

        let formated = {
            concat: '',
            preamble: '',
            subject: '',
            token: '',
            expires: ''
        };

        if (true === _.isObject(spartanToken) && (spartanToken.V3Token || '').length !== 0) {

            formated = Object.assign({}, formated, {
                concat: String(spartanToken.SpartanToken || ''),
                preamble: String(spartanToken.V3Preamble || ''),
                token: String(spartanToken.V3Token || ''),
                subject: _.get(spartanToken, 'Players[0].Subject'),
                expires: _.get(spartanToken, 'ExpiresUtc.ISO8601Date') || ''
            });

        } else {

            const date = new Date();
            date.setHours(date.getHours() + 3);

            formated = Object.assign({}, formated, {
                concat: spartanToken,
                preamble: (spartanToken.match(/v[2-3]=/g) || '')[0] || '',
                token: (
                    (spartanToken.split(';')[1] || '') ||
                    (spartanToken.split('=')[1] || '')
                ),
                subject: (spartanToken.split('=')[1] || '').split(';')[0] || '',
                expires: _.get(spartanToken, 'ExpiresUtc.ISO8601Date') || date.toISOString()
            });

        }

        this.spartanToken = formated;
        return this;

    }

    /**
     * Should auto-renew on expiration
     * @return {boolean}
     */
    autoRenewOnExpiration = () => this.autoRenew

    /**
     * Generate spartan token
     * @param {string} email
     * @param {string} password
     * @param {boolean=} autoRenew
     * @throws SpartanTokenError
     * @return Promise
     */
    generate = async (email, password, autoRenew = true) => {

        const retriever = new SpartanTokenRetriever(email, password);
        const spartanToken = await retriever.retrieve();

        return new Promise(resolve => {
            this.setAutoRenewStatus(autoRenew);
            this.setEmail(email).setPassword(password);
            return resolve(spartanToken);
        });
        
    }

    /**
     * Renew spartan token with current credentials
     * @throws SpartanTokenError
     * @return Promise
     */
    renew = async () => {

        const generate = await this.generate(
            this.getEmail(),
            this.getPassword(),
            this.autoRenewOnExpiration()
        );

        return new Promise(resolve => {
            this.setSpartanToken(generate);
            return resolve(true);
        });

    }
    
}

export default (new SpartanTokenManager())