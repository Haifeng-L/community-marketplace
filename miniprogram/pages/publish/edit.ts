import { listingService } from '../../services/listing'

Page({
  data: { id:'', title:'', price:'', description:'', images:[] as string[] },
  async onLoad(options: Record<string,string>) {
    const item = options.id ? await listingService.get(options.id) : undefined
    if (!item) return
    this.setData({ id:item.id, title:item.title, price:String(item.price), description:item.description, images:item.images })
  },
})
