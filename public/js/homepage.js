let statRowHtml = `<label for "statistics"></label>
        <select id="statistics" name="statistics">
          <optgroup label="Rushing">
            <option value="rushingYards">Rushing Yards</option>
            <option value="rushingAttempts">Rush Attempts</option>
            <option value="yardsPerRushAttempt">Yards per carry</option>
            <option value="rushingTouchdowns">Rushing TDs</option>
            <option value="longRushing">Longest Rush</option>
          <optgroup label="Receiving">
            <option value="receivingYards">Receiving Yards</option>
            <option value="receptions">Receptions</option>
            <option value="receivingTargets">Receiving Targets</option>
            <option value="receivingTouchdowns">Receiving TDs</option>
            <option value="yardsPerReception">Yards Per Rec</option>
            <option value="longReception">Longest Reception</option>
          <optgroup label="Passing">
            <option value="PassingYards">Passing Yards</option>
            <option value="PassingTDs">Passing TDs</option>
            <option value="CompletionPercentage">Completion Percentage</option>
            <option value="QBR">QBR</option>
          <optgroup label="Total">
            <option value="TotalYards">Total Yards</option>
            <option value="TotalTouchdowns">Total Touchdowns</option>
        </select>

        <select id="operator" name="operator">
          <option value=">">Greater Than</option>
          <option value="<">Less Than</option>
          <option value="=">Equal To</option>
        </select>

        <input type="float" name="quantifier">

        <button type="button" onclick="addStatToQuery()">+</button>

        <select id="season" name="season">
          <option value="2017">2017</option>
          <option value="2018">2018</option>
          <option value="2019">2019</option>
        </select>`;

function addStatToQuery() {
  let statsWrapper = document.getElementById("stat_chooser_wrapper");
  let newStatRow = document.createElement("div");
  newStatRow.className = "search_wrapper";
  newStatRow.innerHTML = statRowHtml;
  statsWrapper.appendChild(newStatRow);
}
