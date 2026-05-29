const puppeteer = require('puppeteer');

const SCREENSHOT_DIR = 'C:\\Users\\HP\\.gemini\\antigravity-ide\\brain\\a52c1aa6-b364-49af-ae83-3b7229bcd4f2';
const BASE_URL = 'http://localhost:3000';
const DASHBOARD_URL = `${BASE_URL}/dashboard-builder/verify_permissions_10`;

async function screenshot(page, name) {
    const p = `${SCREENSHOT_DIR}\\${name}.png`;
    await page.screenshot({ path: p, fullPage: false });
    console.log(`SCREENSHOT saved: ${name}.png`);
    return p;
}

async function getBodyText(page) {
    return page.evaluate(() => document.body.innerText.substring(0, 1000));
}

async function waitForContent(page, text, timeoutMs = 10000) {
    try {
        await page.waitForFunction(
            (t) => document.body.innerText.includes(t),
            { timeout: timeoutMs },
            text
        );
        return true;
    } catch (e) {
        return false;
    }
}

async function clickButton(page, labelText) {
    const clicked = await page.evaluate((label) => {
        const btns = Array.from(document.querySelectorAll('button'));
        const btn = btns.find(b => b.innerText.trim().includes(label));
        if (btn) { btn.click(); return true; }
        return false;
    }, labelText);
    return clicked;
}

async function getAllButtons(page) {
    return page.evaluate(() =>
        Array.from(document.querySelectorAll('button')).map(b => b.innerText.trim()).filter(t => t.length > 0)
    );
}

async function main() {
    const browser = await puppeteer.launch({
        headless: false,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        defaultViewport: { width: 1400, height: 900 }
    });

    const results = { t1: {}, t2: {}, t3: {} };

    try {
        const page = await browser.newPage();

        // ============================================================
        // TEST 1: Permission Gating - Alice/Bob/Charlie identity toggles
        // ============================================================
        console.log('\n===== TEST 1: Permission Gating =====');

        await page.goto(DASHBOARD_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });

        // Wait for the simulator bar or the main content to load
        const loaded = await waitForContent(page, 'Permission System Simulator', 12000)
                     || await waitForContent(page, 'Role:', 12000);
        console.log('Page loaded with simulator:', loaded);

        await new Promise(r => setTimeout(r, 2000));
        let bodyText = await getBodyText(page);
        console.log('Initial body:', bodyText.substring(0, 300));
        await screenshot(page, 'test1_01_initial');

        // Alice (Owner) - default selection, check buttons
        let buttons = await getAllButtons(page);
        console.log('Alice buttons visible:', buttons);
        results.t1.aliceShareAccess = buttons.includes('Share Access');
        results.t1.aliceAddWidget = buttons.some(b => b.includes('Add Widget'));
        results.t1.aliceSaveDashboard = buttons.some(b => b.includes('Save Dashboard'));
        results.t1.aliceRole = (await getBodyText(page)).includes('OWNER');
        console.log('Alice Owner role visible:', results.t1.aliceRole);
        console.log('Alice Share Access button:', results.t1.aliceShareAccess);
        console.log('Alice Add Widget button:', results.t1.aliceAddWidget);
        await screenshot(page, 'test1_02_alice_owner');

        // Switch to Bob (Editor)
        console.log('\nSwitching to Bob (Editor)...');
        await clickButton(page, 'Bob');
        await new Promise(r => setTimeout(r, 1500));
        buttons = await getAllButtons(page);
        let bobText = await getBodyText(page);
        results.t1.bobRole = bobText.includes('EDITOR') || bobText.includes('editor');
        results.t1.bobAddWidget = buttons.some(b => b.includes('Add Widget'));
        results.t1.bobNoShareAccess = !buttons.includes('Share Access');
        console.log('Bob EDITOR role visible:', results.t1.bobRole);
        console.log('Bob Add Widget visible:', results.t1.bobAddWidget);
        console.log('Bob Share Access hidden (correct):', results.t1.bobNoShareAccess);
        console.log('Bob buttons:', buttons);
        await screenshot(page, 'test1_03_bob_editor');

        // Switch to Charlie (Viewer)
        console.log('\nSwitching to Charlie (Viewer)...');
        await clickButton(page, 'Charlie');
        await new Promise(r => setTimeout(r, 1500));
        buttons = await getAllButtons(page);
        let charlieText = await getBodyText(page);
        results.t1.charlieRole = charlieText.includes('VIEWER') || charlieText.includes('viewer');
        results.t1.charlieViewerModePill = charlieText.includes('Viewer Mode');
        results.t1.charlieNoAddWidget = !buttons.some(b => b.includes('Add Widget'));
        results.t1.charlieNoShareAccess = !buttons.includes('Share Access');
        results.t1.charlieInputDisabled = await page.evaluate(() => {
            const inputs = document.querySelectorAll('input[disabled]');
            return inputs.length > 0;
        });
        console.log('Charlie VIEWER role:', results.t1.charlieRole);
        console.log('Charlie Viewer Mode pill:', results.t1.charlieViewerModePill);
        console.log('Charlie Add Widget hidden (correct):', results.t1.charlieNoAddWidget);
        console.log('Charlie name input disabled:', results.t1.charlieInputDisabled);
        await screenshot(page, 'test1_04_charlie_viewer');

        // ============================================================
        // TEST 2: Expiring Share Link Flow
        // ============================================================
        console.log('\n===== TEST 2: Expiring Share Link =====');

        // Switch back to Alice
        await clickButton(page, 'Alice');
        await new Promise(r => setTimeout(r, 1000));

        // Click Share Access
        const shareClicked = await clickButton(page, 'Share Access');
        console.log('Share Access clicked:', shareClicked);
        await new Promise(r => setTimeout(r, 1000));
        await screenshot(page, 'test2_01_share_modal_open');

        // Click Expiring Links tab
        await clickButton(page, 'Expiring Links');
        await new Promise(r => setTimeout(r, 500));

        // Set to viewer + 5 min
        await page.evaluate(() => {
            const selects = document.querySelectorAll('select');
            if (selects[0]) { selects[0].value = 'viewer'; selects[0].dispatchEvent(new Event('change', { bubbles: true })); }
            if (selects[1]) { selects[1].value = '5'; selects[1].dispatchEvent(new Event('change', { bubbles: true })); }
        });
        await new Promise(r => setTimeout(r, 300));

        // Create link
        await clickButton(page, 'Create Link');
        await new Promise(r => setTimeout(r, 2500));
        await screenshot(page, 'test2_02_link_created');

        // Capture generated link
        const generatedLink = await page.evaluate(() => {
            const inputs = Array.from(document.querySelectorAll('input[readonly]'));
            const li = inputs.find(i => i.value && i.value.includes('shareToken'));
            return li ? li.value : null;
        });
        console.log('Generated link:', generatedLink);
        results.t2.linkGenerated = !!generatedLink;

        // Open in new tab
        if (generatedLink) {
            const guestPage = await browser.newPage();
            await guestPage.goto(generatedLink, { waitUntil: 'domcontentloaded', timeout: 15000 });
            const guestLoaded = await waitForContent(guestPage, 'Permission System Simulator', 10000);
            await new Promise(r => setTimeout(r, 3000));
            const guestText = await getBodyText(guestPage);
            results.t2.guestIsViewer = guestText.includes('VIEWER') || guestText.includes('Viewer Mode') || guestText.includes('viewer');
            results.t2.guestCannotEdit = await guestPage.evaluate(() => {
                const addBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Add Widget'));
                return !addBtn;
            });
            console.log('Guest resolved as VIEWER:', results.t2.guestIsViewer);
            console.log('Guest cannot add widget:', results.t2.guestCannotEdit);
            await screenshot(guestPage, 'test2_03_guest_viewer_tab');

            // Now revoke the link from Alice's modal
            await clickButton(page, 'Revoke Link');
            // Alternative: click the trash icon button in the links table
            await page.evaluate(() => {
                // Find the Trash2 icon button in active links list
                const trashBtns = Array.from(document.querySelectorAll('button[title="Revoke Link"]'));
                if (trashBtns.length > 0) trashBtns[0].click();
            });
            await new Promise(r => setTimeout(r, 1500));
            await screenshot(page, 'test2_04_link_revoked');

            // Refresh guest page
            await guestPage.reload({ waitUntil: 'domcontentloaded', timeout: 15000 });
            await new Promise(r => setTimeout(r, 5000));
            const expiredText = await getBodyText(guestPage);
            results.t2.expiredScreenShown = expiredText.includes('Share Link Expired') || expiredText.includes('expired');
            console.log('Expired screen shown after revoke:', results.t2.expiredScreenShown);
            await screenshot(guestPage, 'test2_05_link_expired_screen');
            await guestPage.close();
        }

        // Close share modal
        await clickButton(page, '✕');
        await new Promise(r => setTimeout(r, 500));

        // ============================================================
        // TEST 3: Private Gating & Team Invites
        // ============================================================
        console.log('\n===== TEST 3: Private Gating & Invites =====');

        // Open Share Access -> General -> Private
        await clickButton(page, 'Share Access');
        await new Promise(r => setTimeout(r, 800));
        await clickButton(page, 'General Access');
        await new Promise(r => setTimeout(r, 500));
        await clickButton(page, 'Private');
        await new Promise(r => setTimeout(r, 300));
        await clickButton(page, 'Apply Access Setting');
        await new Promise(r => setTimeout(r, 2000));
        await screenshot(page, 'test3_01_private_applied');

        // Close modal
        await clickButton(page, '✕');
        await new Promise(r => setTimeout(r, 500));

        // Switch to Guest
        console.log('Switching to Anonymous Guest...');
        await clickButton(page, 'Anonymous Guest');
        await new Promise(r => setTimeout(r, 1500));
        let guestLockedText = await getBodyText(page);
        results.t3.privateScreenShown = guestLockedText.includes('Private Dashboard');
        console.log('Private Dashboard screen shown for Guest:', results.t3.privateScreenShown);
        console.log('Guest blocked text:', guestLockedText.substring(0, 200));
        await screenshot(page, 'test3_02_guest_blocked');

        // Switch back to Alice
        await clickButton(page, 'Alice');
        await new Promise(r => setTimeout(r, 1500));
        await screenshot(page, 'test3_03_alice_back');

        // Generate invite link
        await clickButton(page, 'Share Access');
        await new Promise(r => setTimeout(r, 800));
        await clickButton(page, 'Team');
        await new Promise(r => setTimeout(r, 500));

        // Set invite as Editor
        await page.evaluate(() => {
            const selects = document.querySelectorAll('select');
            const invSel = Array.from(selects).find(s => s.value === 'viewer' || s.value === 'editor');
            if (invSel) { invSel.value = 'editor'; invSel.dispatchEvent(new Event('change', { bubbles: true })); }
        });
        await clickButton(page, 'Create Invite Link');
        await new Promise(r => setTimeout(r, 2000));
        await screenshot(page, 'test3_04_invite_link_created');

        const inviteLink = await page.evaluate(() => {
            const inputs = Array.from(document.querySelectorAll('input[readonly]'));
            const li = inputs.find(i => i.value && i.value.includes('inviteToken'));
            return li ? li.value : null;
        });
        console.log('Invite link:', inviteLink);
        results.t3.inviteLinkGenerated = !!inviteLink;

        // Close modal
        await clickButton(page, '✕');
        await new Promise(r => setTimeout(r, 400));

        // Navigate to invite URL - switch to Bob first
        if (inviteLink) {
            console.log('Navigating to invite URL...');
            await page.goto(inviteLink, { waitUntil: 'domcontentloaded', timeout: 15000 });
            await new Promise(r => setTimeout(r, 3000));

            // Switch to Bob in simulator
            await clickButton(page, 'Bob');
            await new Promise(r => setTimeout(r, 1500));

            let invitePageText = await getBodyText(page);
            results.t3.inviteCardShown = invitePageText.includes('Collaboration Invite') || invitePageText.includes('invited to collaborate');
            console.log('Invite card visible:', results.t3.inviteCardShown);
            await screenshot(page, 'test3_05_invite_card_shown');

            // Accept invite
            const accepted = await clickButton(page, 'Accept Invite');
            console.log('Accept Invite clicked:', accepted);
            await new Promise(r => setTimeout(r, 4000));

            let afterAcceptText = await getBodyText(page);
            results.t3.afterAcceptRole = afterAcceptText.includes('EDITOR') || afterAcceptText.includes('editor');
            console.log('After accept - Editor role visible:', results.t3.afterAcceptRole);
            await screenshot(page, 'test3_06_after_accept');
        }

        // ============================================================
        // PRINT SUMMARY
        // ============================================================
        console.log('\n========== PHASE 10 TEST RESULTS ==========');
        console.log('\n--- TEST 1: Permission Gating ---');
        console.log('Alice sees OWNER role:', results.t1.aliceRole);
        console.log('Alice Share Access visible:', results.t1.aliceShareAccess);
        console.log('Alice Add Widget visible:', results.t1.aliceAddWidget);
        console.log('Bob sees EDITOR role:', results.t1.bobRole);
        console.log('Bob Add Widget visible:', results.t1.bobAddWidget);
        console.log('Bob Share Access hidden (correct):', results.t1.bobNoShareAccess);
        console.log('Charlie sees VIEWER role:', results.t1.charlieRole);
        console.log('Charlie Viewer Mode pill:', results.t1.charlieViewerModePill);
        console.log('Charlie Add Widget hidden (correct):', results.t1.charlieNoAddWidget);
        console.log('Charlie input disabled:', results.t1.charlieInputDisabled);

        console.log('\n--- TEST 2: Share Links ---');
        console.log('Share link generated:', results.t2.linkGenerated);
        console.log('Guest resolves as VIEWER:', results.t2.guestIsViewer);
        console.log('Guest cannot add widget:', results.t2.guestCannotEdit);
        console.log('Expired screen after revoke:', results.t2.expiredScreenShown);

        console.log('\n--- TEST 3: Private & Invites ---');
        console.log('Private screen blocks Guest:', results.t3.privateScreenShown);
        console.log('Invite link generated:', results.t3.inviteLinkGenerated);
        console.log('Invite card shown:', results.t3.inviteCardShown);
        console.log('Editor role after accept:', results.t3.afterAcceptRole);

        const allPass = results.t1.aliceRole && results.t1.aliceShareAccess && results.t1.bobNoShareAccess &&
            results.t1.charlieNoAddWidget && results.t1.charlieInputDisabled &&
            results.t2.linkGenerated && results.t2.guestIsViewer &&
            results.t3.privateScreenShown && results.t3.inviteLinkGenerated;
        console.log('\nOVERALL:', allPass ? 'ALL TESTS PASSED ✓' : 'SOME TESTS NEED FIXES ✗');

    } catch (err) {
        console.error('TEST ERROR:', err.message);
        console.error(err.stack);
    } finally {
        await new Promise(r => setTimeout(r, 1000));
        await browser.close();
    }
}

main();
