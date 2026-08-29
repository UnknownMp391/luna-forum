{{/*
展开通用名称。默认包含 release 名，release 名已含 chart 名时则不重复。
*/}}
{{- define "luna-forum.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{- define "luna-forum.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{- define "luna-forum.labels" -}}
app.kubernetes.io/name: {{ include "luna-forum.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
helm.sh/chart: {{ printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" }}
{{- end }}

{{- define "luna-forum.selectorLabels" -}}
app.kubernetes.io/name: {{ include "luna-forum.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/* 应用配置 Secret 名称 */}}
{{- define "luna-forum.configSecretName" -}}
{{- if .Values.configExistingSecret }}
{{- .Values.configExistingSecret }}
{{- else }}
{{- include "luna-forum.fullname" . }}-config
{{- end }}
{{- end }}

{{/*
校验必填项并序列化应用配置为 CONFIG 环境变量所需的 JSON 字符串。
结构与应用的 config.json 完全一致。
*/}}
{{- define "luna-forum.configJson" -}}
{{- $uri := dig "mongodb" "uri" "" .Values.config -}}
{{- if not $uri -}}
{{- fail "必须设置 config.mongodb.uri，例如 --set config.mongodb.uri=mongodb://user:pass@mongodb:27017" -}}
{{- end -}}
{{- $js := dig "jwt_secret" "" .Values.config -}}
{{- if not $js -}}
{{- fail "必须设置 config.jwt_secret，例如 --set config.jwt_secret=$(openssl rand -hex 32)" -}}
{{- end -}}
{{- toJson .Values.config -}}
{{- end -}}
