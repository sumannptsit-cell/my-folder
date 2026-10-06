/* =========================================================
   TENTMAKER OPEN — CAPSTONE 1
   app.js

   Architecture:
   LOAD → STORE → SHOW

   LOAD:
   Download four CSV datasets from Google Sheets.

   STORE:
   Keep the datasets in:
   people[]
   groups[]
   memberships[]
   posts[]

   SHOW:
   Render Groups, Leader Channels and History.
========================================================= */


/* =========================================================
   1. GOOGLE SHEET CSV LINKS
========================================================= */

const PEOPLE_CSV_URL =
    "https://docs.google.com/spreadsheets/d/1V-VSeRAvUNCDR9eh7mYE5c4q6Q9DP5L8wu3OlWr3CFs/gviz/tq?tqx=out:csv&sheet=People&headers=1";

const GROUPS_CSV_URL =
    "https://docs.google.com/spreadsheets/d/1V-VSeRAvUNCDR9eh7mYE5c4q6Q9DP5L8wu3OlWr3CFs/gviz/tq?tqx=out:csv&sheet=Groups&headers=1";

const MEMBERSHIPS_CSV_URL =
    "https://docs.google.com/spreadsheets/d/1V-VSeRAvUNCDR9eh7mYE5c4q6Q9DP5L8wu3OlWr3CFs/gviz/tq?tqx=out:csv&sheet=Memberships&headers=1";

const POSTS_CSV_URL =
    "https://docs.google.com/spreadsheets/d/1V-VSeRAvUNCDR9eh7mYE5c4q6Q9DP5L8wu3OlWr3CFs/gviz/tq?tqx=out:csv&sheet=Posts&headers=1";


/* =========================================================
   2. APPLICATION STATE
========================================================= */

let people = [];
let groups = [];
let memberships = [];
let posts = [];

let selectedGroupId = "";
let selectedLeaderId = "";
let selectedPersonId = "";

let currentView = "groups";


/* =========================================================
   3. DOM REFERENCES
========================================================= */

const loadingState = document.getElementById("loadingState");
const errorState = document.getElementById("errorState");
const appContent = document.getElementById("appContent");

const errorMessage = document.getElementById("errorMessage");

const retryButton = document.getElementById("retryButton");
const errorRetryButton = document.getElementById("errorRetryButton");

const statusDot = document.getElementById("statusDot");
const statusTitle = document.getElementById("statusTitle");
const statusText = document.getElementById("statusText");

const groupSelect = document.getElementById("groupSelect");
const leaderSelect = document.getElementById("leaderSelect");
const personSelect = document.getElementById("personSelect");

const groupSelectorSection =
    document.getElementById("groupSelectorSection");

const leaderSelectorSection =
    document.getElementById("leaderSelectorSection");

const personSelectorSection =
    document.getElementById("personSelectorSection");

const pageTitle = document.getElementById("pageTitle");
const pageSubtitle = document.getElementById("pageSubtitle");

const groupsView = document.getElementById("groupsView");
const leadersView = document.getElementById("leadersView");
const historyView = document.getElementById("historyView");

const groupViewTitle = document.getElementById("groupViewTitle");
const groupViewSubtitle = document.getElementById("groupViewSubtitle");

const groupPeriod = document.getElementById("groupPeriod");
const groupLeader = document.getElementById("groupLeader");
const memberCount = document.getElementById("memberCount");
const postCount = document.getElementById("postCount");

const rosterList = document.getElementById("rosterList");
const groupPostsList = document.getElementById("groupPostsList");

const leaderViewTitle = document.getElementById("leaderViewTitle");
const leaderViewSubtitle = document.getElementById("leaderViewSubtitle");
const leaderChannelList = document.getElementById("leaderChannelList");

const historyViewTitle = document.getElementById("historyViewTitle");
const historyViewSubtitle = document.getElementById("historyViewSubtitle");

const historyGroupsList =
    document.getElementById("historyGroupsList");

const historyLeadersList =
    document.getElementById("historyLeadersList");


/* =========================================================
   4. INITIALIZATION
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    setupNavigation();
    setupSelectors();
    setupRetryButtons();

    startApp();
});


/* =========================================================
   5. START APPLICATION
========================================================= */

async function startApp() {

    showLoadingState();

    try {

        await loadAllData();

        buildGroupSelect();
        buildLeaderSelect();
        buildPersonSelect();

        setConnectedStatus();

        /*
         * Do NOT invent a current user.
         *
         * We select the first available group only because
         * the Groups screen needs something to display.
         *
         * No fake "current user" is created.
         */

        if (groups.length > 0) {

            selectedGroupId = groups[0].group_id;

            groupSelect.value = selectedGroupId;

            renderGroup(selectedGroupId);

        } else {

            renderGroupsEmpty();

        }

        showApplication();

    } catch (error) {

        console.error("Application loading failed:", error);

        showErrorState(
            "The data could not be loaded. Please check the CSV links or try again."
        );
    }
}


/* =========================================================
   6. LOAD ALL DATA
========================================================= */

async function loadAllData() {

    /*
     * Promise.all starts all four requests together.
     * This is faster than downloading them one by one.
     */

    const [
        loadedPeople,
        loadedGroups,
        loadedMemberships,
        loadedPosts
    ] = await Promise.all([

        loadTab(PEOPLE_CSV_URL),
        loadTab(GROUPS_CSV_URL),
        loadTab(MEMBERSHIPS_CSV_URL),
        loadTab(POSTS_CSV_URL)

    ]);

    people = loadedPeople;
    groups = loadedGroups;
    memberships = loadedMemberships;
    posts = loadedPosts;
}


/* =========================================================
   7. LOAD ONE CSV TAB
========================================================= */

async function loadTab(url) {

    const response = await fetch(url, {
        cache: "no-store"
    });

    if (!response.ok) {
        throw new Error(
            `CSV request failed: ${response.status}`
        );
    }

    const text = await response.text();

    if (!text.trim()) {
        return [];
    }

    return parseCSV(text);
}


/* =========================================================
   8. ROBUST CSV PARSER
========================================================= */

function parseCSV(text) {

    const rows = [];
    let row = [];
    let cell = "";

    let insideQuotes = false;

    for (let i = 0; i < text.length; i++) {

        const char = text[i];
        const nextChar = text[i + 1];

        if (char === '"') {

            if (insideQuotes && nextChar === '"') {

                cell += '"';
                i++;

            } else {

                insideQuotes = !insideQuotes;
            }

        } else if (char === "," && !insideQuotes) {

            row.push(cell);
            cell = "";

        } else if (
            (char === "\n" || char === "\r") &&
            !insideQuotes
        ) {

            if (char === "\r" && nextChar === "\n") {
                i++;
            }

            row.push(cell);
            cell = "";

            if (
                row.length > 1 ||
                row.some(value => value.trim() !== "")
            ) {
                rows.push(row);
            }

            row = [];

        } else {

            cell += char;
        }
    }

    /*
     * Add the final cell/row.
     */

    row.push(cell);

    if (
        row.length > 1 ||
        row.some(value => value.trim() !== "")
    ) {
        rows.push(row);
    }

    if (rows.length === 0) {
        return [];
    }

    const headers = rows[0].map(header =>
        header.trim()
    );

    return rows
        .slice(1)
        .map(values => {

            const object = {};

            headers.forEach((header, index) => {

                object[header] =
                    (values[index] ?? "").trim();

            });

            return object;
        });
}


/* =========================================================
   9. FIND HELPERS
========================================================= */

function findPerson(personId) {

    return people.find(
        person => person.person_id === personId
    );
}


function findGroup(groupId) {

    return groups.find(
        group => group.group_id === groupId
    );
}


/* =========================================================
   10. SAFE HTML ESCAPING
========================================================= */

function escapeHTML(value) {

    const stringValue =
        value === null || value === undefined
            ? ""
            : String(value);

    return stringValue
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


/* =========================================================
   11. INITIALS
========================================================= */

function getInitials(name) {

    const safeName =
        typeof name === "string"
            ? name.trim()
            : "";

    if (!safeName) {
        return "?";
    }

    const pieces = safeName
        .split(/\s+/)
        .filter(Boolean);

    if (pieces.length === 0) {
        return "?";
    }

    if (pieces.length === 1) {

        return pieces[0]
            .slice(0, 2)
            .toUpperCase();
    }

    return (
        pieces[0][0] +
        pieces[pieces.length - 1][0]
    ).toUpperCase();
}


/* =========================================================
   12. DATE HELPERS
========================================================= */

function getDateValue(dateText) {

    if (!dateText) {
        return null;
    }

    const timestamp =
        Date.parse(dateText);

    if (Number.isNaN(timestamp)) {
        return null;
    }

    return timestamp;
}


function sortPostsNewestFirst(postA, postB) {

    const dateA = getDateValue(postA.date);
    const dateB = getDateValue(postB.date);

    /*
     * Valid dates first.
     * Invalid/blank dates go to the bottom.
     */

    if (dateA === null && dateB === null) {
        return 0;
    }

    if (dateA === null) {
        return 1;
    }

    if (dateB === null) {
        return -1;
    }

    return dateB - dateA;
}


function formatDate(dateText) {

    if (!dateText) {
        return "Date not available";
    }

    const timestamp = Date.parse(dateText);

    if (Number.isNaN(timestamp)) {
        return escapeHTML(dateText);
    }

    return new Intl.DateTimeFormat(
        undefined,
        {
            year: "numeric",
            month: "short",
            day: "numeric"
        }
    ).format(new Date(timestamp));
}


/* =========================================================
   13. EMPTY STATE HELPER
========================================================= */

function emptyState(title, message) {

    return `
        <div class="empty-state">
            <strong>${escapeHTML(title)}</strong>
            <span>${escapeHTML(message)}</span>
        </div>
    `;
}


/* =========================================================
   14. NAVIGATION
========================================================= */

function setupNavigation() {

    const buttons =
        document.querySelectorAll(".nav-button");

    buttons.forEach(button => {

        button.addEventListener("click", () => {

            const view =
                button.dataset.view;

            switchView(view);
        });
    });
}


function switchView(view) {

    currentView = view;

    document
        .querySelectorAll(".nav-button")
        .forEach(button => {

            button.classList.toggle(
                "active",
                button.dataset.view === view
            );
        });


    groupsView.classList.toggle(
        "hidden",
        view !== "groups"
    );

    leadersView.classList.toggle(
        "hidden",
        view !== "leaders"
    );

    historyView.classList.toggle(
        "hidden",
        view !== "history"
    );


    groupSelectorSection.classList.toggle(
        "hidden",
        view !== "groups"
    );

    leaderSelectorSection.classList.toggle(
        "hidden",
        view !== "leaders"
    );

    personSelectorSection.classList.toggle(
        "hidden",
        view !== "history"
    );


    if (view === "groups") {

        pageTitle.textContent = "Groups";

        pageSubtitle.textContent =
            "Browse group members and group posts.";

        if (selectedGroupId) {
            renderGroup(selectedGroupId);
        }

    }


    if (view === "leaders") {

        pageTitle.textContent =
            "Leader Channels";

        pageSubtitle.textContent =
            "View a leader's posts across groups and periods.";

        if (selectedLeaderId) {
            renderLeaderChannel(selectedLeaderId);
        } else {

            leaderViewTitle.textContent =
                "Select a leader";

            leaderViewSubtitle.textContent =
                "Choose a leader from the menu.";

            leaderChannelList.innerHTML =
                emptyState(
                    "No leader selected",
                    "Select a leader to view their channel."
                );
        }

    }


    if (view === "history") {

        pageTitle.textContent = "History";

        pageSubtitle.textContent =
            "View past memberships and continued leader-channel access.";

        if (selectedPersonId) {
            renderHistory(selectedPersonId);
        } else {

            historyViewTitle.textContent =
                "Select a person";

            historyGroupsList.innerHTML =
                emptyState(
                    "No person selected",
                    "Choose a person from the menu to view their history."
                );

            historyLeadersList.innerHTML =
                emptyState(
                    "No person selected",
                    "Choose a person to see available leader channels."
                );
        }
    }
}


/* =========================================================
   15. SELECTORS
========================================================= */

function setupSelectors() {

    groupSelect.addEventListener(
        "change",
        event => {

            selectedGroupId =
                event.target.value;

            if (selectedGroupId) {
                renderGroup(selectedGroupId);
            }
        }
    );


    leaderSelect.addEventListener(
        "change",
        event => {

            selectedLeaderId =
                event.target.value;

            if (selectedLeaderId) {
                renderLeaderChannel(
                    selectedLeaderId
                );
            }
        }
    );


    personSelect.addEventListener(
        "change",
        event => {

            selectedPersonId =
                event.target.value;

            if (selectedPersonId) {
                renderHistory(
                    selectedPersonId
                );
            }
        }
    );
}


/* =========================================================
   16. BUILD GROUP SELECTOR
========================================================= */

function buildGroupSelect() {

    groupSelect.innerHTML = "";

    if (groups.length === 0) {

        groupSelect.innerHTML =
            `<option value="">No groups available</option>`;

        return;
    }

    const sortedGroups =
        [...groups].sort(compareGroupsByPeriod);

    sortedGroups.forEach(group => {

        const option =
            document.createElement("option");

        option.value = group.group_id;

        option.textContent =
            `${group.group_name} (${group.period})`;

        groupSelect.appendChild(option);
    });
}


/* =========================================================
   17. BUILD LEADER SELECTOR
========================================================= */

function buildLeaderSelect() {

    leaderSelect.innerHTML = "";

    const leaders = people
        .filter(person =>
            person.role &&
            person.role.toLowerCase() === "leader"
        )
        .sort((a, b) =>
            a.full_name.localeCompare(
                b.full_name
            )
        );

    if (leaders.length === 0) {

        leaderSelect.innerHTML =
            `<option value="">No leaders available</option>`;

        return;
    }

    const placeholder =
        document.createElement("option");

    placeholder.value = "";
    placeholder.textContent =
        "Select a leader";

    leaderSelect.appendChild(
        placeholder
    );

    leaders.forEach(person => {

        const option =
            document.createElement("option");

        option.value =
            person.person_id;

        option.textContent =
            person.full_name;

        leaderSelect.appendChild(option);
    });
}


/* =========================================================
   18. BUILD PERSON SELECTOR
========================================================= */

function buildPersonSelect() {

    personSelect.innerHTML = "";

    const placeholder =
        document.createElement("option");

    placeholder.value = "";
    placeholder.textContent =
        "Select a person";

    personSelect.appendChild(
        placeholder
    );

    const sortedPeople =
        [...people].sort((a, b) =>
            a.full_name.localeCompare(
                b.full_name
            )
        );

    sortedPeople.forEach(person => {

        const option =
            document.createElement("option");

        option.value =
            person.person_id;

        option.textContent =
            person.full_name;

        personSelect.appendChild(option);
    });
}


/* =========================================================
   19. GROUP SORT
========================================================= */

function compareGroupsByPeriod(groupA, groupB) {

    const periodA =
        Number.parseInt(
            groupA.period,
            10
        );

    const periodB =
        Number.parseInt(
            groupB.period,
            10
        );

    if (
        Number.isFinite(periodA) &&
        Number.isFinite(periodB)
    ) {

        if (periodA !== periodB) {
            return periodA - periodB;
        }
    }

    return (
        String(groupA.period)
            .localeCompare(
                String(groupB.period)
            )
        ||
        String(groupA.group_name)
            .localeCompare(
                String(groupB.group_name)
            )
    );
}


/* =========================================================
   20. GROUP VIEW
========================================================= */

function renderGroup(groupId) {

    const group =
        findGroup(groupId);

    if (!group) {

        renderGroupNotFound();

        return;
    }

    const leader =
        findPerson(group.leader_id);

    const groupMemberships =
        memberships.filter(
            membership =>
                membership.group_id === groupId
        );


    /*
     * Find members from membership records.
     */

    const members =
        groupMemberships
            .map(membership =>
                findPerson(
                    membership.person_id
                )
            )
            .filter(Boolean);


    /*
     * Group posts.
     */

    const groupPosts =
        posts
            .filter(post =>
                post.board_type === "group" &&
                post.board_id === groupId
            )
            .sort(sortPostsNewestFirst);


    groupViewTitle.textContent =
        group.group_name;

    groupViewSubtitle.textContent =
        `Roster and board for ${group.group_name}.`;

    groupPeriod.textContent =
        group.period || "—";

    groupLeader.textContent =
        leader
            ? leader.full_name
            : "Leader not found";

    memberCount.textContent =
        members.length;

    postCount.textContent =
        groupPosts.length;


    renderRoster(
        leader,
        members
    );

    renderGroupPosts(
        groupPosts
    );
}


/* =========================================================
   21. ROSTER
========================================================= */

function renderRoster(leader, members) {

    if (!leader && members.length === 0) {

        rosterList.innerHTML =
            emptyState(
                "No members",
                "This group does not currently have roster records."
            );

        return;
    }


    const leaderHTML =
        leader
            ? createRosterPersonHTML(
                leader,
                true
            )
            : "";


    const memberHTML =
        members
            .filter(member =>
                !leader ||
                member.person_id !==
                    leader.person_id
            )
            .sort((a, b) =>
                a.full_name.localeCompare(
                    b.full_name
                )
            )
            .map(member =>
                createRosterPersonHTML(
                    member,
                    false
                )
            )
            .join("");


    rosterList.innerHTML =
        leaderHTML + memberHTML;


    if (!rosterList.innerHTML.trim()) {

        rosterList.innerHTML =
            emptyState(
                "No members",
                "No roster members were found."
            );
    }
}


function createRosterPersonHTML(
    person,
    isLeader
) {

    const initials =
        escapeHTML(
            getInitials(
                person.full_name
            )
        );

    const name =
        escapeHTML(
            person.full_name
        );

    const role =
        escapeHTML(
            person.role || "member"
        );

    return `
        <div class="roster-item">

            <div class="avatar">
                ${initials}
            </div>

            <div class="person-info">

                <div class="person-name">
                    ${name}
                </div>

                <div class="person-role">
                    ${role}
                </div>

            </div>

            ${
                isLeader
                    ? `
                        <span class="leader-badge">
                            Leader
                        </span>
                    `
                    : ""
            }

        </div>
    `;
}


/* =========================================================
   22. GROUP POSTS
========================================================= */

function renderGroupPosts(groupPosts) {

    if (groupPosts.length === 0) {

        groupPostsList.innerHTML =
            emptyState(
                "No posts yet",
                "This group does not have any posts."
            );

        return;
    }

    groupPostsList.innerHTML =
        groupPosts
            .map(
                post =>
                    createPostHTML(post)
            )
            .join("");
}


/* =========================================================
   23. LEADER CHANNEL
========================================================= */

function renderLeaderChannel(leaderId) {

    const leader =
        findPerson(leaderId);

    if (!leader) {

        leaderViewTitle.textContent =
            "Leader not found";

        leaderViewSubtitle.textContent =
            "The selected leader does not exist in the loaded data.";

        leaderChannelList.innerHTML =
            emptyState(
                "Leader not found",
                "Choose another leader from the menu."
            );

        return;
    }


    selectedLeaderId = leaderId;

    leaderSelect.value = leaderId;


    const leaderPosts =
        posts
            .filter(post =>
                post.board_type === "leader" &&
                post.board_id === leaderId
            )
            .sort(sortPostsNewestFirst);


    leaderViewTitle.textContent =
        leader.full_name;

    leaderViewSubtitle.textContent =
        "Posts shared by this leader across their groups and periods.";


    if (leaderPosts.length === 0) {

        leaderChannelList.innerHTML =
            emptyState(
                "No posts yet",
                `${leader.full_name} has no leader-channel posts.`
            );

        return;
    }


    leaderChannelList.innerHTML =
        leaderPosts
            .map(post =>
                createPostHTML(post)
            )
            .join("");
}


/* =========================================================
   24. POST HTML
========================================================= */

function createPostHTML(post) {

    const author =
        findPerson(
            post.author_id
        );

    const authorName =
        author
            ? author.full_name
            : "Unknown author";


    const attachment =
        post.attachment_label
            ? `
                <div class="attachment">
                    📎
                    ${escapeHTML(
                        post.attachment_label
                    )}
                </div>
            `
            : "";


    return `
        <article class="post-card">

            <div class="post-top">

                <div class="post-author">
                    ${escapeHTML(authorName)}
                </div>

                <div class="post-date">
                    ${formatDate(post.date)}
                </div>

            </div>

            <div class="post-text">
                ${escapeHTML(post.text || "")}
            </div>

            ${attachment}

        </article>
    `;
}


/* =========================================================
   25. HISTORY VIEW
========================================================= */

function renderHistory(personId) {

    const person =
        findPerson(personId);

    if (!person) {

        historyViewTitle.textContent =
            "Person not found";

        historyViewSubtitle.textContent =
            "The selected person does not exist in the loaded data.";

        historyGroupsList.innerHTML =
            emptyState(
                "Person not found",
                "Choose another person from the menu."
            );

        historyLeadersList.innerHTML =
            emptyState(
                "No leader channels",
                "A valid person is required."
            );

        return;
    }


    selectedPersonId = personId;

    personSelect.value = personId;


    historyViewTitle.textContent =
        person.full_name;

    historyViewSubtitle.textContent =
        "Past groups and leader channels available through past membership.";


    /*
     * =========================================
     * PART A
     *
     * Find every group this person belonged to.
     * =========================================
     */

    const personMemberships =
        memberships.filter(
            membership =>
                membership.person_id === personId
        );


    const theirGroups =
        personMemberships
            .map(membership =>
                findGroup(
                    membership.group_id
                )
            )
            .filter(Boolean);


    /*
     * Sort History by period.
     *
     * This is important because the order of
     * Membership rows cannot be trusted.
     */

    theirGroups.sort(
        compareGroupsByPeriod
    );


    renderHistoryGroups(
        theirGroups
    );


    /*
     * =========================================
     * PART B
     *
     * Find every leader whose group the person
     * has belonged to.
     *
     * Use Set to remove duplicates.
     * =========================================
     */

    const leaderIds =
        new Set(
            theirGroups
                .map(group =>
                    group.leader_id
                )
                .filter(Boolean)
        );


    const theirLeaders =
        [...leaderIds]
            .map(leaderId =>
                findPerson(
                    leaderId
                )
            )
            .filter(Boolean)
            .sort((a, b) =>
                a.full_name.localeCompare(
                    b.full_name
                )
            );


    renderHistoryLeaders(
        theirLeaders
    );
}


/* =========================================================
   26. HISTORY GROUPS — PART A
========================================================= */

function renderHistoryGroups(
    theirGroups
) {

    if (theirGroups.length === 0) {

        historyGroupsList.innerHTML =
            emptyState(
                "No history found",
                "This person has no recorded group memberships."
            );

        return;
    }


    historyGroupsList.innerHTML =
        theirGroups
            .map(group => {

                const leader =
                    findPerson(
                        group.leader_id
                    );

                return `
                    <article class="history-item">

                        <span class="history-period">
                            ${escapeHTML(
                                group.period || "Period not available"
                            )}
                        </span>

                        <div class="history-title">
                            ${escapeHTML(
                                group.group_name
                            )}
                        </div>

                        <div class="history-detail">
                            Leader:
                            ${
                                leader
                                    ? escapeHTML(
                                        leader.full_name
                                    )
                                    : "Leader not found"
                            }
                        </div>

                    </article>
                `;
            })
            .join("");
}


/* =========================================================
   27. HISTORY LEADERS — PART B
========================================================= */

function renderHistoryLeaders(
    theirLeaders
) {

    if (theirLeaders.length === 0) {

        historyLeadersList.innerHTML =
            emptyState(
                "No leader channels",
                "No leader channels are available from this person's past memberships."
            );

        return;
    }


    /*
     * Every leader appears only once because
     * theirLeaders was created from a Set.
     */

    historyLeadersList.innerHTML =
        theirLeaders
            .map(leader => {

                const initials =
                    escapeHTML(
                        getInitials(
                            leader.full_name
                        )
                    );

                return `
                    <button
                        type="button"
                        class="leader-channel-button"
                        data-leader-id="${escapeHTML(
                            leader.person_id
                        )}"
                    >

                        <div class="avatar">
                            ${initials}
                        </div>

                        <div class="person-info">

                            <div class="person-name">
                                ${escapeHTML(
                                    leader.full_name
                                )}
                            </div>

                            <div class="person-role">
                                Leader channel
                            </div>

                        </div>

                        <span class="channel-arrow">
                            →
                        </span>

                    </button>
                `;
            })
            .join("");


    /*
     * Make each History leader clickable.
     */

    historyLeadersList
        .querySelectorAll(
            ".leader-channel-button"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const leaderId =
                        button.dataset.leaderId;

                    selectedLeaderId =
                        leaderId;

                    leaderSelect.value =
                        leaderId;

                    switchView(
                        "leaders"
                    );

                    renderLeaderChannel(
                        leaderId
                    );
                }
            );
        });
}


/* =========================================================
   28. GROUP EMPTY / NOT FOUND
========================================================= */

function renderGroupsEmpty() {

    groupViewTitle.textContent =
        "No groups available";

    groupViewSubtitle.textContent =
        "The loaded data does not contain any groups.";

    groupPeriod.textContent = "—";
    groupLeader.textContent = "—";
    memberCount.textContent = "0";
    postCount.textContent = "0";

    rosterList.innerHTML =
        emptyState(
            "No groups",
            "There are no groups in the loaded sheet."
        );

    groupPostsList.innerHTML =
        emptyState(
            "No posts",
            "There are no group posts to display."
        );
}


function renderGroupNotFound() {

    groupViewTitle.textContent =
        "Group not found";

    groupViewSubtitle.textContent =
        "The selected group does not exist in the loaded data.";

    groupPeriod.textContent = "—";
    groupLeader.textContent = "—";
    memberCount.textContent = "0";
    postCount.textContent = "0";

    rosterList.innerHTML =
        emptyState(
            "Group not found",
            "Choose another group from the menu."
        );

    groupPostsList.innerHTML =
        emptyState(
            "Group not found",
            "No posts can be displayed."
        );
}


/* =========================================================
   29. LOADING / ERROR UI
========================================================= */

function showLoadingState() {

    loadingState.classList.remove(
        "hidden"
    );

    errorState.classList.add(
        "hidden"
    );

    appContent.classList.add(
        "hidden"
    );

    retryButton.classList.add(
        "hidden"
    );

    statusDot.className =
        "status-dot loading";

    statusTitle.textContent =
        "Connecting...";

    statusText.textContent =
        "Loading data";
}


function showApplication() {

    loadingState.classList.add(
        "hidden"
    );

    errorState.classList.add(
        "hidden"
    );

    appContent.classList.remove(
        "hidden"
    );

    retryButton.classList.add(
        "hidden"
    );
}


function showErrorState(message) {

    loadingState.classList.add(
        "hidden"
    );

    appContent.classList.add(
        "hidden"
    );

    errorState.classList.remove(
        "hidden"
    );

    retryButton.classList.remove(
        "hidden"
    );

    errorMessage.textContent =
        message;

    statusDot.className =
        "status-dot error";

    statusTitle.textContent =
        "Connection error";

    statusText.textContent =
        "Data could not be loaded";
}


function setConnectedStatus() {

    statusDot.className =
        "status-dot connected";

    statusTitle.textContent =
        "Data connected";

    statusText.textContent =
        `${people.length} people · ${groups.length} groups`;
}


/* =========================================================
   30. RETRY
========================================================= */

function setupRetryButtons() {

    retryButton.addEventListener(
        "click",
        startApp
    );

    errorRetryButton.addEventListener(
        "click",
        startApp
    );
}