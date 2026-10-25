// Run: npx tsx scripts/test-ssrf.ts  (plain node:assert, exits non-zero on failure)
import assert from 'node:assert/strict'
import { isBlockedIp, assertPublicHost, safeFetch } from '../src/lib/ssrf'

const blocked = ['127.0.0.1', '10.1.2.3', '172.16.0.1', '172.31.255.255', '192.168.1.1', '169.254.169.254',
  '100.64.0.1', '0.0.0.0', '224.0.0.1', '255.255.255.255', '::1', '::', 'fd00::1', 'fe80::1', '::ffff:127.0.0.1', '::ffff:10.0.0.1']
const allowed = ['8.8.8.8', '1.1.1.1', '172.15.255.255', '172.32.0.1', '2606:4700:4700::1111', '::ffff:8.8.8.8']
for (const ip of blocked) assert.equal(isBlockedIp(ip), true, `should block ${ip}`)
for (const ip of allowed) assert.equal(isBlockedIp(ip), false, `should allow ${ip}`)

async function main() {
  await assert.rejects(assertPublicHost('localhost'))
  await assert.rejects(assertPublicHost('127.0.0.1'))
  await assert.rejects(assertPublicHost('[::1]'))
  await assert.rejects(safeFetch('file:///etc/passwd'))
  await assert.rejects(safeFetch('http://169.254.169.254/latest/meta-data/'))
  console.log('ssrf tests passed')
}

main().catch((e) => { console.error(e); process.exit(1) })
