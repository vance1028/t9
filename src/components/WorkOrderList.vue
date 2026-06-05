<template>
  <div>
    <div class="section-header">
      <span class="section-title">维护工单 ({{ store.workOrders.length }})</span>
      <el-button size="small" type="primary" @click="showCreate = true">
        新建工单
      </el-button>
    </div>

    <div v-if="store.workOrders.length === 0" class="empty-state">
      暂无工单
    </div>

    <div v-for="order in store.workOrders" :key="order.id" class="work-order-item">
      <div class="work-order-header">
        <span class="work-order-title">{{ order.buoyName }}</span>
        <el-tag :type="statusTagType(order.status)" size="small">
          {{ statusText(order.status) }}
        </el-tag>
      </div>
      <div class="work-order-meta">
        <span>派给: {{ order.assignee }}</span>
        <span v-if="order.plannedTime">计划: {{ formatTime(order.plannedTime) }}</span>
      </div>
      <div class="work-order-desc">{{ order.description }}</div>
      <div v-if="order.result" class="work-order-result">处理结果: {{ order.result }}</div>
      <div class="alert-item-actions">
        <el-button size="small" @click="editOrder(order)" :disabled="order.status === 'completed'">
          编辑
        </el-button>
        <el-button size="small" type="primary" @click="startOrder(order)" :disabled="order.status !== 'pending'">
          开始处理
        </el-button>
        <el-button size="small" type="success" @click="completeOrder(order)" :disabled="order.status === 'completed'">
          完成
        </el-button>
      </div>
    </div>

    <el-dialog v-model="showCreate" title="新建工单" width="420px">
      <el-form :model="formData" label-width="80px">
        <el-form-item label="浮标">
          <el-select v-model="formData.buoyId" placeholder="选择浮标" style="width: 100%;">
            <el-option v-for="b in store.buoys" :key="b.id" :label="b.name" :value="b.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="派给谁">
          <el-input v-model="formData.assignee" placeholder="维护人员姓名" />
        </el-form-item>
        <el-form-item label="计划时间">
          <el-date-picker
            v-model="formData.plannedTime"
            type="datetime"
            placeholder="选择计划出海时间"
            style="width: 100%;"
            value-format="x"
          />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="formData.description" type="textarea" :rows="3" placeholder="问题描述" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreate = false">取消</el-button>
        <el-button type="primary" @click="submitCreate">创建</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showEdit" title="编辑工单" width="420px">
      <el-form :model="editForm" label-width="80px">
        <el-form-item label="派给谁">
          <el-input v-model="editForm.assignee" />
        </el-form-item>
        <el-form-item label="计划时间">
          <el-date-picker
            v-model="editForm.plannedTime"
            type="datetime"
            style="width: 100%;"
            value-format="x"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="editForm.status" style="width: 100%;">
            <el-option label="待处理" value="pending" />
            <el-option label="处理中" value="in_progress" />
            <el-option label="已完成" value="completed" />
          </el-select>
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="editForm.description" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item label="处理结果">
          <el-input v-model="editForm.result" type="textarea" :rows="2" placeholder="处理结果" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showEdit = false">取消</el-button>
        <el-button type="primary" @click="submitEdit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useBuoyStore } from '@/stores/buoy';
import dayjs from 'dayjs';
import type { WorkOrder, WorkOrderStatus } from '@/types';
import { ElMessage } from 'element-plus';

const store = useBuoyStore();

const showCreate = ref(false);
const showEdit = ref(false);
const editingId = ref<string | null>(null);

const formData = reactive({
  buoyId: '',
  assignee: '',
  plannedTime: null as number | null,
  description: '',
});

const editForm = reactive({
  assignee: '',
  plannedTime: null as number | null,
  status: 'pending' as WorkOrderStatus,
  description: '',
  result: '',
});

function statusText(status: WorkOrderStatus): string {
  switch (status) {
    case 'pending': return '待处理';
    case 'in_progress': return '处理中';
    case 'completed': return '已完成';
  }
}

function statusTagType(status: WorkOrderStatus): string {
  switch (status) {
    case 'pending': return 'warning';
    case 'in_progress': return 'primary';
    case 'completed': return 'success';
  }
}

function formatTime(ts: number): string {
  return dayjs(Number(ts)).format('MM-DD HH:mm');
}

function submitCreate() {
  if (!formData.buoyId || !formData.assignee) {
    ElMessage.warning('请填写必要信息');
    return;
  }
  store.createWorkOrder(formData.buoyId, {
    assignee: formData.assignee,
    plannedTime: formData.plannedTime,
    description: formData.description,
  });
  showCreate.value = false;
  formData.buoyId = '';
  formData.assignee = '';
  formData.plannedTime = null;
  formData.description = '';
  ElMessage.success('工单创建成功');
}

function editOrder(order: WorkOrder) {
  editingId.value = order.id;
  editForm.assignee = order.assignee;
  editForm.plannedTime = order.plannedTime;
  editForm.status = order.status;
  editForm.description = order.description;
  editForm.result = order.result;
  showEdit.value = true;
}

function submitEdit() {
  if (!editingId.value) return;
  store.updateWorkOrder(editingId.value, {
    assignee: editForm.assignee,
    plannedTime: editForm.plannedTime,
    status: editForm.status,
    description: editForm.description,
    result: editForm.result,
  });
  showEdit.value = false;
  editingId.value = null;
  ElMessage.success('工单更新成功');
}

function startOrder(order: WorkOrder) {
  store.updateWorkOrder(order.id, { status: 'in_progress' });
}

function completeOrder(order: WorkOrder) {
  editingId.value = order.id;
  editForm.assignee = order.assignee;
  editForm.plannedTime = order.plannedTime;
  editForm.status = 'completed';
  editForm.description = order.description;
  editForm.result = order.result;
  showEdit.value = true;
}
</script>
