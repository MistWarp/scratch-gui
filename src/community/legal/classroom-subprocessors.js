/* eslint-disable max-len */
import {LEGAL} from './config.js';

const classroomSubprocessors = () => `
Last updated ${LEGAL.effectiveDate}.

This page lists every company that handles student data for MistWarp Classroom, and the other services the editor contacts. We announce changes here and on the Classroom page at least 30 days before a new sub-processor starts handling student data, as the [Data Processing Agreement](/classroom/dpa) requires.

## Sub-processors

- **Cloudflare, Inc.**, United States, with a global network. It hosts the MistWarp website, carries and encrypts all traffic to MistWarp, stores project files in Cloudflare R2, and runs the connection server that lets browsers in a live group project or presentation find each other. It handles all student data while it travels, and project files while they are stored. Transfers are covered by Cloudflare's Data Processing Addendum, including the UK International Data Transfer Addendum.

## Run by MistWarp

- **The MistWarp API and database**, on MistWarp's own server in the United Kingdom. It stores accounts, classes, assignments, submissions and project records.
- **The live collaboration broker** at collab_warp.mistium.com. It passes connection details between browsers in the same live session. In live group work and presentations, the browsers in a session then connect directly to each other, so they can see each other's IP addresses. Only students in the class and its teachers can join.

## Public services the editor contacts

These services send files to the editor. They see the device's IP address, like any website, but receive no student names, accounts or work.

- **TurboWarp extension gallery** (extensions.turbowarp.org), when a student opens the extension library.
- **MistWarp extension gallery** (extensions.mistium.com), run by MistWarp.
- **Scratch asset server** (assets.scratch.mit.edu), run by the Scratch Foundation, for images and sounds in the sprite, costume and sound libraries.

## Services some blocks use

A few Scratch blocks work by sending what is in the block to an outside service. They only do this when a project uses them, and they never send the student's name or account. Teachers who do not want this can ask students not to use these extensions.

- **Text to Speech** sends the words to be spoken to the Scratch Foundation's speech service (synthesis-service.scratch.mit.edu).
- **Translate** sends the words to be translated to TurboWarp's translation service (trampoline.turbowarp.org).
- **Hardware extensions** (micro:bit, LEGO, and Go Direct Force and Acceleration) contact the Scratch Foundation's device service (device-manager.scratch.mit.edu) to find the device.
- **Face Sensing** downloads its face detection code from jsDelivr (cdn.jsdelivr.net). The camera image stays on the device.
- **Other extensions from the galleries** above may contact the services they are built for. Students cannot load extensions from anywhere else.

## Services used for teachers only

For these, MistWarp is the controller of the teacher's own information. They receive no student data.

- **Rotur** (rotur.dev), which provides teachers' accounts, sign-in and notifications outside Classroom.
- **Stripe, Inc.**, which takes card payments for Classroom plans. It receives the teacher's MistWarp user ID and the payment details the teacher enters on Stripe's own checkout page.
`.trim();

export default classroomSubprocessors;
