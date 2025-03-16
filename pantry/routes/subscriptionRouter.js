const express = require('express');
const {get, list} = require('../services/redis');
const {activeUsersInRoom} = require('../services/ws');

const router = express.Router({mergeParams: true});

async function getUserNpub(req, res) {
  let usernpub = undefined;
  res.type('application/json');
  // Return Not Found error if no user id provided
  const userId = req.params.userId ?? '';
  if (userId.length == 0) {
    res.sendStatus(404);
    return usernpub;
  }
  // get user info
  if (userId.length == 43) {
    let userinfo = await get(`identities/${userId}`);
    if (userinfo != undefined) {
      if (userinfo.identities != undefined) {
        for (let identity of userinfo.identities) {
          if (identity.type == undefined) continue;
          if (identity.type != 'nostr') continue;
          if (identity.id == undefined) continue;
          usernpub = identity.id;
          break;
        }
      }
    }
  }
  if (userId.length == 63 && userId.startsWith('npub')) {
    usernpub = userId;
  }
  // return Forbidden error if user doesnt have npub
  if (!usernpub) {
    res.sendStatus(403);
  }
  return usernpub;
}

async function decorateSubscription(ret, usernpub) {
  try {
    // Lookup current subscription tier and expiration
    let subkey = `subscription/${usernpub}/status`;
    let substatus = await get(subkey);
    if (substatus) {
      ret.tier = substatus.tier;
      ret.expires = substatus.expires;
      return true;
    }
  } catch (e) {
    console.log('Error in decorateSubscription', e);
  }
  return false;
}

async function decorateInvoice(ret, usernpub) {
  // Lookup current invoice
  let ikey = `subscription/${usernpub}/invoice`;
  let invoicestatus = await get(ikey);
  if (invoicestatus) {
    ret.pr = invoicestatus.pr;
    ret.mem = invoicestatus.memo;
    ret.paid = invoicestatus.paid;
    ret.amount = invoicestatus.amount;
    return true;
  }
  return false;
}

async function createInvoice(ret, usernpub, days) {
  // this should come from the .env file
  //      LNBITS_HOST
  //      SUBSCRIPTIONS_WALLET_API_KEY
  // this has to be stored in the subscription/${usernpub}/invoice
  //      paymenthash, needed to lookup https://<lnbits-host>/api/v1/payments/<paymenthash> -H "X-Api-Key: <lnbits-api-key>" -H "Content-type: application/json"
  // these are convenient to store in subscription/user/invoice in case something borks with lnbits
  //      pr = paymentrequest (bolt11 lnbc...)
  //      memo = the description for the invoice
  // when lookup from lnbits, will also have
  //      paid = true/false
  //      status = pending if paid is false
  //      pending = true/false
  //      amount = msat amount
  //      expiry = the timestamp the invoice is no longer good
  return;
}

// gets subscription status for a user, returning the tier and expiration date timestamp
router.get('/:userId', async function (req, res) {
  let usernpub = await getUserNpub(req, res);
  if (!usernpub) return;
  let now = Math.floor(Date.now() / 1000);
  // Default return is expired
  let ret = {tier: 0, expires: 0};
  // Subscription info
  let hasSubscription = await decorateSubscription(ret, usernpub);
  ret.hasSubscribed = hasSubscription;
  ret.isActive = hasSubscription && ret.expires > now;
  // Check for any pending invoices
  let hasInvoice = await decorateInvoice(ret, usernpub);
  ret.hasInvoice = hasInvoice;
  console.log(ret);
  res.send(ret);
});

// gets subscription payment history for a user, returning an array of data
router.get('/:userId/history', async function (req, res) {
  let usernpub = await getUserNpub(req, res);
  if (!usernpub) return;
  // TODO:
  let ret = [];
  let subkey = `subscription/${usernpub}/p*`;
  let payments = await list(subkey);
  if (payments) {
    for (let payment of payments) {
      ret.push({
        paymentDate: payment.paymentDate,
        memo: payment.memo,
        tier: payment.tier,
        amount: payment.amount,
      });
    }
  }
  res.send(ret);
});

// request an invoice to extend subscription :days for the given :userId
router.get('/:userId/invoice/:days', async function (req, res) {
  let usernpub = await getUserNpub(req, res);
  if (!usernpub) return;
  // TODO:
  // -- lookup current subscription tier and expiration
  // -- lookup any existing invoices in redis for this user
  // -- if invoice not yet expired/deleted, return that
  // -- calculate description for invoice as 'Corny Chat renewal for x days to <date>'
  // -- interface with lnbits over API to subscription wallet to generate invoice
  // -- track current invoice in redis for this user
  // -- return invoice
  res.send({});
});

// user wants to cancel existing invoice request
router.delete('/:userId/invoice', async function (req, res) {
  let usernpub = await getUserNpub(req, res);
  if (!usernpub) return;
  // TODO:
  // -- lookup current subscription tier and expiration
  // -- lookup any existing invoices in redis for this user
  // -- delete and indicate invoice was cancelled to allow creating a new one
  // -- if no invoice, return current subscription tier and expiration
  res.send({});
});

// check status of an invoice payment request (to be called periodically every few seconds after invoice created)
router.get('/:userId/paymentstatus/:pr', async function (req, res) {
  let usernpub = await getUserNpub(req, res);
  if (!usernpub) return;
  res.send({});
});

module.exports = router;
