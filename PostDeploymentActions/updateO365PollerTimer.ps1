$date = Get-Date
$min = ($date.Minute + 1) % 5
$sec = $date.Second
$new_schedule = "$sec $min-59/5 * * * *"
Write-Output "Updating O365Poller timer trigger with ($new_schedule)."
$master_function = Get-Content '..\\wwwroot\\O365Poller\\function.json' -raw | ConvertFrom-Json
$master_function.bindings | % {if($_.name -eq 'AlertlogicO365ListTimer'){$_.schedule=$new_schedule}}
$master_function | ConvertTo-Json  | set-content '..\\wwwroot\\O365Poller\\function.json'