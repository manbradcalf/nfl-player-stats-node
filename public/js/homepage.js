let statRowHtml = `<!-- stat selector for ranges -->
        <label for "statistics">
        </label>
        <select id="statistics" name="statistics">
          <optgroup label="Rushing">
            <option value="RushYards">Rushing Yards</option>
            <option value="RushAttempts">Rush Attempts</option>
            <option value="YPC">Yards per carry</option>
            <option value="RushTDs">Rushing TDs</option>
          <optgroup label="Receiving">
            <option value="ReceivingYards">Receiving Yards</option>
            <option value="Receptions">Receptions</option>
            <option value="ReceivingTargets">Receiving Targets</option>
            <option value="ReceivingTDs">Receiving TDs</option>
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
          <option value="GreaterThan">Greater Than</option>
          <option value="LessThan">Less Than</option>
          <option value="EqualTo">Equal To</option>
        </select>

        <input type="float" name="quantifier">

        <button type ="button" onclick="addStatToQuery()">+</>`;

function addStatToQuery() {
  let statsWrapper = document.getElementById("stat_chooser_wrapper");
  let newStatRow = document.createElement("div");
  newStatRow.className = "search_wrapper";
  newStatRow.innerHTML = statRowHtml;
  statsWrapper.appendChild(newStatRow);
}
