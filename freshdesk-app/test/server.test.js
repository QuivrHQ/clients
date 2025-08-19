'use strict'
const assert = require('assert/strict')

describe('server handlers', function () {
  it('onAppInstallHandler — success path calls invokeTemplate', function () {
    // Stub only supported platform APIs
    const req = this.stub('$request', 'invokeTemplate').callsFake(function (name, opts) {
      if (name === 'getHelpdeskAccount') {
        // Simulate no existing account found (throws error)
        return Promise.reject(new Error('Account not found'))
      }

      if (name === 'createHelpdeskAccount') {
        const body = JSON.parse(opts.body)
        assert.equal(body.subdomain, 'acme.freshdesk.com') // derived from endpoint URL
        assert.equal(body.api_key, 'APIKEY')
        assert.equal(body.email, 'user@example.com')
        assert.equal(body.provider, 'freshdesk')
        assert.equal(body.time_range, 30) // iparam override
        return Promise.resolve({ status: 200, response: { ok: true } })
      }

      return Promise.reject(new Error(`Unexpected template: ${name}`))
    })

    const payload = {
      currentHost: { endpoint_urls: { freshdesk: 'https://acme.freshdesk.com' } },
      iparams: { freshdeskApiKey: 'APIKEY', email: 'user@example.com', historicalLookupWindow: 30 }
    }

    return this.invoke('onAppInstall', payload).then(() => req.restore())
  })

  it('onAppInstallHandler — request failure completes event and fails install', function () {
    const req = this.stub('$request', 'invokeTemplate').callsFake((name, opts) => {
      if (name === 'getHelpdeskAccount') {
        // Simulate no existing account found (throws error)
        return Promise.reject(new Error('Account not found'))
      }

      if (name === 'createHelpdeskAccount') {
        const body = JSON.parse(opts.body)
        // your server uses split('//')[1] -> 'acme.freshdesk.com'
        assert.equal(body.subdomain, 'acme.freshdesk.com')
        assert.equal(body.api_key, 'APIKEY')
        assert.equal(body.email, 'user@example.com')
        assert.equal(body.provider, 'freshdesk')
        // no historicalLookupWindow in payload -> default 180
        assert.equal(body.time_range, 180)
        // simulate failure from backend
        return Promise.reject(new Error('boom'))
      }

      return Promise.reject(new Error(`Unexpected template: ${name}`))
    })

    const payload = {
      currentHost: { endpoint_urls: { freshdesk: 'https://acme.freshdesk.com' } },
      iparams: { freshdeskApiKey: 'APIKEY', email: 'user@example.com' }
    }

    // the handler should resolve after calling renderData({ message: ... })
    return this.invoke('onAppInstall', payload)
      .then(() => {
        assert.fail('Expected install to fail and promise to reject')
      })
      .catch((err) => {
        // FDK may pass a string or an object { message: '...' }
        const msg = typeof err === 'string' ? err : err && err.message
        assert.equal(msg, 'Quivr API key or Freshdesk API key is incorrect.')
        assert.equal(req.calledTwice, true) // Now called twice: getHelpdeskAccount + createHelpdeskAccount
      })
      .finally(() => req.restore())
  })

  it('onAppInstallHandler — existing account found, skips creation', function () {
    const req = this.stub('$request', 'invokeTemplate').callsFake(function (name, opts) {
      if (name === 'getHelpdeskAccount') {
        // Simulate existing account found
        return Promise.resolve({
          status: 200,
          response: JSON.stringify({ id: 'existing-account-123' })
        })
      }

      // Should not call createHelpdeskAccount when account exists
      assert.fail(`Unexpected call to ${name} when account already exists`)
    })

    const payload = {
      currentHost: { endpoint_urls: { freshdesk: 'https://acme.freshdesk.com' } },
      iparams: { freshdeskApiKey: 'APIKEY', email: 'user@example.com', historicalLookupWindow: 30 }
    }

    return this.invoke('onAppInstall', payload).then(() => {
      assert.equal(req.calledOnce, true) // Only getHelpdeskAccount should be called
      req.restore()
    })
  })

  it('onAppInstallHandler — getHelpdeskAccount returns response without account id, creates new account', function () {
    const req = this.stub('$request', 'invokeTemplate').callsFake(function (name, opts) {
      if (name === 'getHelpdeskAccount') {
        // Simulate response without account id
        return Promise.resolve({
          status: 200,
          response: JSON.stringify({ message: 'No account found' })
        })
      }

      if (name === 'createHelpdeskAccount') {
        const body = JSON.parse(opts.body)
        assert.equal(body.subdomain, 'acme.freshdesk.com')
        assert.equal(body.api_key, 'APIKEY')
        assert.equal(body.email, 'user@example.com')
        assert.equal(body.provider, 'freshdesk')
        assert.equal(body.time_range, 180) // default value
        return Promise.resolve({ status: 200, response: { ok: true } })
      }

      return Promise.reject(new Error(`Unexpected template: ${name}`))
    })

    const payload = {
      currentHost: { endpoint_urls: { freshdesk: 'https://acme.freshdesk.com' } },
      iparams: { freshdeskApiKey: 'APIKEY', email: 'user@example.com' }
    }

    return this.invoke('onAppInstall', payload).then(() => {
      assert.equal(req.calledTwice, true) // Both getHelpdeskAccount and createHelpdeskAccount should be called
      req.restore()
    })
  })

  it('onSettingsUpdate — handler executes without errors', function () {
    // No stubs needed; just ensure the handler runs
    return this.invoke('onSettingsUpdate', { iparams: { any: 'value' } })
  })
})
