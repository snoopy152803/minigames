// Renders an "/answers" page: today's answer (locked until this browser has
// finished today's puzzle) plus a freely-viewable list of previous days.
// Each game page supplies getAnswerForDay(day) using its own data/generator.
window.AnswersPage = {
  render(opts) {
    // opts: { game, gameName, playHref, archiveHref, onlyToday, historyDays,
    //         poolLength, getAnswerForDay(day) }
    // poolLength (if given) is the size of the puzzle list this game picks
    // from each day. The history window is capped to poolLength - 1 so the
    // "previous answers" list can never reach far enough back to include a
    // repeat of today's own puzzle (repeats happen no sooner than exactly
    // poolLength days apart — see shared/daily.js).
    const container = document.getElementById("answersRoot");
    const day = window.DailyPuzzle.dayNumber();
    const completedToday = window.DailyPuzzle.isCompleted(opts.game, day);

    let html = '<div class="answer-card today">' +
      '<div class="answer-date">Today &middot; ' + window.DailyPuzzle.formatDate(new Date()) + "</div>";
    if (completedToday) {
      html += '<div class="answer-value">' + opts.getAnswerForDay(day) + "</div>";
    } else {
      html += '<div class="answer-locked">Finish today&rsquo;s puzzle in this browser to reveal it here.<br>' +
        '<a href="' + opts.playHref + '">Play today&rsquo;s ' + opts.gameName + " &rarr;</a></div>";
    }
    html += "</div>";

    if (opts.onlyToday) {
      html += '<p class="answer-archive-link"><a href="' + opts.archiveHref + '">See previous answers &rarr;</a></p>';
    } else {
      html += '<h2 class="answer-heading">Previous answers</h2><div class="answer-list">';
      let n = opts.historyDays || 60;
      if (opts.poolLength) n = Math.min(n, opts.poolLength - 1);
      for (let i = 1; i <= n; i++) {
        const d = day - i;
        if (d < 0) break;
        html += '<div class="answer-row"><span class="answer-row-date">' + window.DailyPuzzle.formatDate(window.DailyPuzzle.dateForDay(d)) + "</span>" +
          '<span class="answer-row-value">' + opts.getAnswerForDay(d) + "</span></div>";
      }
      html += "</div>";
    }
    container.innerHTML = html;
  }
};
