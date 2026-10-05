/* =========================================================
   TENTMAKER CAPSTONE 1
   COMMUNITY DASHBOARD
   ========================================================= */


/* =========================================================
   1. CSV LINKS
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
   2. DATA IN MEMORY
   ========================================================= */

let people = [];

let groups = [];

let memberships = [];

let posts = [];


/* =========================================================
   3. CURRENT STATE
   ========================================================= */

let selectedGroupId = null;

let selectedLeaderId = null;

let selectedPersonId = null;


/* =========================================================
   4. DOM ELEMENTS
   ========================================================= */

const loadingView =
    document.getElementById("loadingView");

const errorView =
    document.getElementById("errorView");

const application =
    document.getElementById("application");

const errorMessage =
    document.getElementById("errorMessage");

const retryButton =
    document.getElementById("retryButton");

const connectionText =
    document.getElementById("connectionText");

const groupList =
    document.getElementById("groupList");

const groupContent =
    document.getElementById("groupContent");

const leaderSelect =
    document.getElementById("leaderSelect");

const personSelect =
    document.getElementById("personSelect");

const leaderContent =
    document.getElementById("leaderContent");

const historyContent =
    document.getElementById("historyContent");

const groupsView =
    document.getElementById("groupsView");

const leaderView =
    document.getElementById("leaderView");

const historyView =
    document.getElementById("historyView");

const pageTitle =
    document.getElementById("pageTitle");

const pageDescription =
    document.getElementById("pageDescription");

const viewLabel =
    document.getElementById("viewLabel");

const currentUserName =
    document.getElementById("currentUserName");

const currentUserRole =
    document.getElementById("currentUserRole");

const userAvatar =
    document.getElementById("userAvatar");

const peopleCount =
    document.getElementById("peopleCount");

const groupsCount =
    document.getElementById("groupsCount");

const postsCount =
    document.getElementById("postsCount");


/* =========================================================
   5. LOAD ONE CSV
   ========================================================= */

async function loadTab(url) {

    const response = await fetch(url);

    if (!response.ok) {

        throw new Error(
            `Could not load data. HTTP ${response.status}`
        );

    }

    const text =
        await response.text();

    return parseCSV(text);
}


/* =========================================================
   6. CSV PARSER
   ========================================================= */

function parseCSV(text) {

    const rows = [];

    let row = [];

    let value = "";

    let insideQuotes = false;


    for (
        let i = 0;
        i < text.length;
        i++
    ) {

        const char = text[i];

        const next = text[i + 1];


        if (
            char === '"' &&
            insideQuotes &&
            next === '"'
        ) {

            value += '"';

            i++;

        }

        else if (char === '"') {

            insideQuotes =
                !insideQuotes;

        }

        else if (
            char === "," &&
            !insideQuotes
        ) {

            row.push(value);

            value = "";

        }

        else if (
            (char === "\n" || char === "\r") &&
            !insideQuotes
        ) {

            if (
                char === "\r" &&
                next === "\n"
            ) {
                i++;
            }

            row.push(value);

            rows.push(row);

            row = [];

            value = "";

        }

        else {

            value += char;

        }

    }


    if (
        value !== "" ||
        row.length > 0
    ) {

        row.push(value);

        rows.push(row);

    }


    if (rows.length === 0) {

        return [];

    }


    const headers =
        rows[0].map(header =>
            header.trim()
        );


    return rows
        .slice(1)
        .filter(row =>
            row.some(value =>
                value.trim() !== ""
            )
        )
        .map(row => {

            const object = {};

            headers.forEach(
                (header, index) => {

                    object[header] =
                        (row[index] || "")
                        .trim();

                }
            );

            return object;

        });

}


/* =========================================================
   7. LOAD ALL DATA
   ========================================================= */

async function loadAllData() {

    people =
        await loadTab(
            PEOPLE_CSV_URL
        );

    groups =
        await loadTab(
            GROUPS_CSV_URL
        );

    memberships =
        await loadTab(
            MEMBERSHIPS_CSV_URL
        );

    posts =
        await loadTab(
            POSTS_CSV_URL
        );

}


/* =========================================================
   8. FIND PERSON
   ========================================================= */

function findPerson(id) {

    return people.find(
        person =>
            person.person_id === id
    );

}


/* =========================================================
   9. FIND GROUP
   ========================================================= */

function findGroup(id) {

    return groups.find(
        group =>
            group.group_id === id
    );

}


/* =========================================================
   10. ESCAPE HTML
   ========================================================= */

function escapeHTML(value) {

    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


/* =========================================================
   11. INITIALS
   ========================================================= */

function getInitials(name) {

    if (!name) {
        return "?";
    }

    return name
        .split(" ")
        .map(part => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();

}


/* =========================================================
   12. SHOW LOADING
   ========================================================= */

function showLoading() {

    loadingView.classList.remove(
        "hidden"
    );

    errorView.classList.add(
        "hidden"
    );

    application.classList.add(
        "hidden"
    );

    connectionText.textContent =
        "Loading...";

}


/* =========================================================
   13. SHOW ERROR
   ========================================================= */

function showError(error) {

    console.error(error);

    loadingView.classList.add(
        "hidden"
    );

    application.classList.add(
        "hidden"
    );

    errorView.classList.remove(
        "hidden"
    );

    connectionText.textContent =
        "Connection error";

    errorMessage.textContent =
        error.message ||
        "Unable to load the community data.";

}


/* =========================================================
   14. SHOW APPLICATION
   ========================================================= */

function showApplication() {

    loadingView.classList.add(
        "hidden"
    );

    errorView.classList.add(
        "hidden"
    );

    application.classList.remove(
        "hidden"
    );

    connectionText.textContent =
        "Data connected";

}


/* =========================================================
   15. BUILD GROUP MENU
   ========================================================= */

function renderGroupNavigation() {

    groupList.innerHTML = "";


    groups.forEach(group => {

        const button =
            document.createElement("button");


        button.className =
            "group-item";


        if (
            group.group_id ===
            selectedGroupId
        ) {

            button.classList.add(
                "active"
            );

        }


        button.innerHTML = `

            <span class="group-item-name">

                ${escapeHTML(
                    group.group_name
                )}

            </span>

            <span class="group-item-period">

                ${escapeHTML(
                    group.period
                )}

            </span>

        `;


        button.addEventListener(
            "click",
            () => {

                selectedGroupId =
                    group.group_id;

                renderGroupNavigation();

                showGroupsView();

                renderGroup();

            }
        );


        groupList.appendChild(
            button
        );

    });

}


/* =========================================================
   16. BUILD LEADER SELECT
   ========================================================= */

function renderLeaderSelect() {

    leaderSelect.innerHTML = `
        <option value="">
            Select a leader
        </option>
    `;


    const leaderIds =
        [...new Set(
            groups.map(
                group =>
                    group.leader_id
            )
        )];


    leaderIds.forEach(id => {

        const person =
            findPerson(id);


        if (!person) {
            return;
        }


        const option =
            document.createElement(
                "option"
            );


        option.value = id;

        option.textContent =
            person.full_name;


        leaderSelect.appendChild(
            option
        );

    });


    if (selectedLeaderId) {
        leaderSelect.value =
            selectedLeaderId;
    }

}


/* =========================================================
   17. BUILD PERSON SELECT
   ========================================================= */

function renderPersonSelect() {

    personSelect.innerHTML = `
        <option value="">
            Select a person
        </option>
    `;


    people.forEach(person => {

        const option =
            document.createElement(
                "option"
            );


        option.value =
            person.person_id;

        option.textContent =
            person.full_name;


        personSelect.appendChild(
            option
        );

    });


    if (selectedPersonId) {
        personSelect.value =
            selectedPersonId;
    }

}


/* =========================================================
   18. SHOW GROUP VIEW
   ========================================================= */

function showGroupsView() {

    groupsView.classList.remove(
        "hidden"
    );

    leaderView.classList.add(
        "hidden"
    );

    historyView.classList.add(
        "hidden"
    );


    pageTitle.textContent =
        "Community Groups";

    pageDescription.textContent =
        "Select a group to view its members and posts.";

    viewLabel.textContent =
        "GROUPS";


    updateNav("groups");

}


/* =========================================================
   19. SHOW LEADER VIEW
   ========================================================= */

function showLeaderView() {

    groupsView.classList.add(
        "hidden"
    );

    leaderView.classList.remove(
        "hidden"
    );

    historyView.classList.add(
        "hidden"
    );


    pageTitle.textContent =
        "Leader Channel";

    pageDescription.textContent =
        "View posts shared by a leader across their groups.";

    viewLabel.textContent =
        "LEADER CHANNEL";


    updateNav("leader");

}


/* =========================================================
   20. SHOW HISTORY VIEW
   ========================================================= */

function showHistoryView() {

    groupsView.classList.add(
        "hidden"
    );

    leaderView.classList.add(
        "hidden"
    );

    historyView.classList.remove(
        "hidden"
    );


    pageTitle.textContent =
        "My History";

    pageDescription.textContent =
        "View group membership history and leader channels.";

    viewLabel.textContent =
        "HISTORY";


    updateNav("history");

}


/* =========================================================
   21. UPDATE NAVIGATION
   ========================================================= */

function updateNav(view) {

    document
        .querySelectorAll(
            ".nav-button"
        )
        .forEach(button => {

            button.classList.toggle(
                "active",
                button.dataset.view === view
            );

        });

}


/* =========================================================
   22. RENDER GROUP
   ========================================================= */

function renderGroup() {

    const group =
        findGroup(
            selectedGroupId
        );


    if (!group) {

        groupContent.innerHTML = `
            <div class="empty-state">

                <strong>
                    No group selected
                </strong>

                Select a group from the left.

            </div>
        `;

        return;

    }


    const leader =
        findPerson(
            group.leader_id
        );


    const groupMemberships =
        memberships.filter(
            membership =>
                membership.group_id ===
                group.group_id
        );


    const members =
        groupMemberships
            .map(
                membership =>
                    findPerson(
                        membership.person_id
                    )
            )
            .filter(Boolean);


    const groupPosts =
        posts
            .filter(post =>
                post.board_type === "group" &&
                post.board_id === group.group_id
            )
            .sort(
                (a, b) =>
                    new Date(b.date) -
                    new Date(a.date)
            );


    let membersHTML = "";


    if (members.length === 0) {

        membersHTML = `
            <div class="empty-state">

                No members found.

            </div>
        `;

    }

    else {

        membersHTML =
            members
                .map(member => `

                    <div class="member">

                        <div class="member-avatar">
                            ${getInitials(
                                member.full_name
                            )}
                        </div>

                        <span class="member-name">
                            ${escapeHTML(
                                member.full_name
                            )}
                        </span>

                    </div>

                `)
                .join("");

    }


    let postsHTML = "";


    if (groupPosts.length === 0) {

        postsHTML = `
            <div class="empty-state">

                <strong>
                    No posts yet
                </strong>

                This group does not have
                any posts.

            </div>
        `;

    }

    else {

        postsHTML =
            groupPosts
                .map(
                    post =>
                        renderPost(post)
                )
                .join("");

    }


    groupContent.innerHTML = `

        <div class="group-header">

            <div class="group-header-top">

                <div>

                    <h2 class="group-title">

                        ${escapeHTML(
                            group.group_name
                        )}

                    </h2>

                    <span class="group-period">

                        ${escapeHTML(
                            group.period
                        )}

                    </span>

                </div>

                <span class="group-badge">
                    GROUP
                </span>

            </div>

        </div>


        <div class="group-grid">


            <!-- MEMBERS -->

            <div class="info-card">

                <span class="card-label">
                    LEADER
                </span>

                ${
                    leader
                        ? `
                            <h3>
                                ${escapeHTML(
                                    leader.full_name
                                )}
                            </h3>

                            <p class="card-muted">
                                ${escapeHTML(
                                    leader.role
                                )}
                            </p>
                          `
                        : `
                            <h3>
                                Unknown
                            </h3>
                          `
                }


                <div
                    style="margin-top: 25px;"
                >

                    <span class="card-label">
                        MEMBERS
                    </span>

                    <div class="member-list">

                        ${membersHTML}

                    </div>

                </div>

            </div>


            <!-- POSTS -->

            <div class="posts-card">

                <div class="posts-heading">

                    <h3>
                        Group Posts
                    </h3>

                    <span class="posts-count">

                        ${groupPosts.length}
                        posts

                    </span>

                </div>

                ${postsHTML}

            </div>


        </div>

    `;

}


/* =========================================================
   23. RENDER POST
   ========================================================= */

function renderPost(post) {

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
                <span class="attachment">

                    📎
                    ${escapeHTML(
                        post.attachment_label
                    )}

                </span>
              `
            : "";


    return `

        <article class="post">

            <div class="post-header">

                <div class="post-avatar">

                    ${getInitials(
                        authorName
                    )}

                </div>

                <div>

                    <span class="post-author">

                        ${escapeHTML(
                            authorName
                        )}

                    </span>

                    <span class="post-date">

                        ${escapeHTML(
                            post.date
                        )}

                    </span>

                </div>

            </div>


            <p class="post-text">

                ${escapeHTML(
                    post.text
                )}

            </p>


            ${attachment}

        </article>

    `;

}


/* =========================================================
   24. LEADER CHANNEL
   ========================================================= */

function renderLeaderChannel() {

    if (!selectedLeaderId) {

        leaderContent.innerHTML = `
            <div class="empty-state">

                <strong>
                    Select a leader
                </strong>

                Choose a leader above to
                see their channel posts.

            </div>
        `;

        return;

    }


    const leader =
        findPerson(
            selectedLeaderId
        );


    if (!leader) {

        return;

    }


    const leaderPosts =
        posts
            .filter(post =>
                post.board_type === "leader" &&
                post.board_id ===
                selectedLeaderId
            )
            .sort(
                (a, b) =>
                    new Date(b.date) -
                    new Date(a.date)
            );


    const postsHTML =
        leaderPosts.length
            ? leaderPosts
                .map(
                    post =>
                        renderPost(post)
                )
                .join("")
            : `
                <div class="empty-state">

                    <strong>
                        No channel posts
                    </strong>

                    This leader has no posts.

                </div>
              `;


    leaderContent.innerHTML = `

        <div class="channel-card">

            <div class="channel-title">

                <div class="channel-avatar">

                    ${getInitials(
                        leader.full_name
                    )}

                </div>

                <div>

                    <h3>
                        ${escapeHTML(
                            leader.full_name
                        )}
                    </h3>

                    <span>
                        Leader Channel
                    </span>

                </div>

            </div>


            ${postsHTML}

        </div>

    `;

}


/* =========================================================
   25. HISTORY
   ========================================================= */

function renderHistory() {

    if (!selectedPersonId) {

        historyContent.innerHTML = `
            <div class="empty-state">

                <strong>
                    Select a person
                </strong>

                Choose a person above to see
                their membership history.

            </div>
        `;

        return;

    }


    const person =
        findPerson(
            selectedPersonId
        );


    if (!person) {
        return;
    }


    const personMemberships =
        memberships.filter(
            membership =>
                membership.person_id ===
                selectedPersonId
        );


    if (personMemberships.length === 0) {

        historyContent.innerHTML = `
            <div class="empty-state">

                <strong>
                    No history found
                </strong>

                This person has no recorded
                group memberships.

            </div>
        `;

        return;

    }


    let historyHTML = "";


    personMemberships.forEach(
        membership => {

            const group =
                findGroup(
                    membership.group_id
                );


            if (!group) {
                return;
            }


            const leader =
                findPerson(
                    group.leader_id
                );


            historyHTML += `

                <div class="history-card">

                    <span class="history-year">

                        ${escapeHTML(
                            group.period
                        )}

                    </span>

                    <h3>

                        ${escapeHTML(
                            group.group_name
                        )}

                    </h3>

                    <p class="card-muted">

                        Leader:

                        ${
                            leader
                                ? escapeHTML(
                                    leader.full_name
                                )
                                : "Unknown"
                        }

                    </p>

                </div>

            `;

        }
    );


    historyContent.innerHTML =
        historyHTML;

}


/* =========================================================
   26. NAVIGATION EVENTS
   ========================================================= */

document
    .querySelectorAll(
        ".nav-button"
    )
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                const view =
                    button.dataset.view;


                if (view === "groups") {

                    showGroupsView();

                    renderGroup();

                }


                if (view === "leader") {

                    showLeaderView();

                    renderLeaderChannel();

                }


                if (view === "history") {

                    showHistoryView();

                    renderHistory();

                }

            }
        );

    });


/* =========================================================
   27. LEADER SELECT EVENT
   ========================================================= */

leaderSelect.addEventListener(
    "change",
    event => {

        selectedLeaderId =
            event.target.value;

        renderLeaderChannel();

    }
);


/* =========================================================
   28. PERSON SELECT EVENT
   ========================================================= */

personSelect.addEventListener(
    "change",
    event => {

        selectedPersonId =
            event.target.value;

        renderHistory();

    }
);


/* =========================================================
   29. RETRY
   ========================================================= */

retryButton.addEventListener(
    "click",
    startApp
);


/* =========================================================
   30. INITIAL USER
   ========================================================= */

function setupInitialUser() {

    /*
       For the first version, choose the first person
       from the loaded data.

       Later this can be replaced with the exact user
       selection required by the project.
    */

    if (people.length === 0) {
        return;
    }


    const user =
        people[0];


    currentUserName.textContent =
        user.full_name;


    currentUserRole.textContent =
        user.role;


    userAvatar.textContent =
        getInitials(
            user.full_name
        );


    selectedPersonId =
        user.person_id;


    personSelect.value =
        user.person_id;

}


/* =========================================================
   31. INITIAL GROUP
   ========================================================= */

function setupInitialGroup() {

    if (groups.length === 0) {

        groupContent.innerHTML = `
            <div class="empty-state">

                <strong>
                    No groups found
                </strong>

                The data source contains no groups.

            </div>
        `;

        return;

    }


    selectedGroupId =
        groups[0].group_id;

    selectedLeaderId =
        groups[0].leader_id || null;


    renderGroupNavigation();

    renderGroup();

}


/* =========================================================
   32. UPDATE SUMMARY COUNTS
   ========================================================= */

function updateSummaryCounts() {

    peopleCount.textContent =
        String(people.length);

    groupsCount.textContent =
        String(groups.length);

    postsCount.textContent =
        String(posts.length);

}


/* =========================================================
   33. START APPLICATION
   ========================================================= */

async function startApp() {

    showLoading();


    try {

        await loadAllData();


        updateSummaryCounts();


        console.log(
            "People:",
            people
        );

        console.log(
            "Groups:",
            groups
        );

        console.log(
            "Memberships:",
            memberships
        );

        console.log(
            "Posts:",
            posts
        );


        setupInitialUser();

        setupInitialGroup();

        renderLeaderSelect();

        renderPersonSelect();

        renderLeaderChannel();

        renderHistory();

        showApplication();

        showGroupsView();


    }

    catch (error) {

        showError(error);

    }

}


/* =========================================================
   33. START
   ========================================================= */

startApp();